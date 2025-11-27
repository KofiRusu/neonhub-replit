#!/usr/bin/env node

import fs from "fs";
import path from "path";
import ts from "typescript";

const ROOT = process.cwd();
const SERVER_FILE = path.join(ROOT, "apps/api/src/server.ts");
const TRPC_ROUTER_FILE = path.join(ROOT, "apps/api/src/trpc/router.ts");
const POSTMAN_COLLECTION_FILE = path.join(ROOT, "postman/NeonHub-API.postman_collection.json");
const OUTPUT_DIR = path.join(ROOT, "docs/api-testing");

const HTTP_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]);

const ensureFile = filePath => {
  if (!fs.existsSync(filePath)) {
    console.error(`Missing required file: ${filePath}`);
    process.exit(1);
  }
};

ensureFile(SERVER_FILE);
ensureFile(POSTMAN_COLLECTION_FILE);

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const toPosixPath = filePath => filePath.replace(/\\/g, "/");

const createSourceFile = filePath =>
  ts.createSourceFile(filePath, fs.readFileSync(filePath, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

const serverSource = createSourceFile(SERVER_FILE);

const resolveModulePath = (baseFile, specifier) => {
  const baseDir = path.dirname(baseFile);
  const absolute = path.resolve(baseDir, specifier);
  const ext = path.extname(absolute);
  const base = ext ? absolute.slice(0, -ext.length) : absolute;
  const hasExplicitFile = Boolean(ext);
  const candidates = new Set();

  const push = candidate => candidates.add(path.normalize(candidate));

  if (hasExplicitFile) {
    push(absolute);
  } else {
    push(absolute);
  }

  push(`${base}.ts`);
  push(`${base}.tsx`);
  push(`${base}.mts`);
  push(`${base}.cts`);
  push(`${base}.mjs`);
  push(`${base}.js`);
  push(`${base}.cjs`);

  if (!hasExplicitFile) {
    push(path.join(base, "index.ts"));
    push(path.join(base, "index.tsx"));
    push(path.join(base, "index.mts"));
    push(path.join(base, "index.mjs"));
    push(path.join(base, "index.js"));
    push(path.join(base, "index.cjs"));
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
};

const importMap = new Map();

serverSource.forEachChild(node => {
  if (!ts.isImportDeclaration(node) || node.importClause?.isTypeOnly) {
    return;
  }
  const specifier = node.moduleSpecifier.getText(serverSource).slice(1, -1);
  const resolvedPath = specifier.startsWith(".") ? resolveModulePath(SERVER_FILE, specifier) : null;
  if (!resolvedPath) {
    return;
  }

  if (node.importClause?.name) {
    importMap.set(node.importClause.name.text, { filePath: resolvedPath });
  }

  if (node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
    node.importClause.namedBindings.elements.forEach(element => {
      const name = element.name.text;
      importMap.set(name, { filePath: resolvedPath });
    });
  }
});

const deriveNotesFromNodes = (nodes, sourceFile) => {
  const notes = new Set();
  for (const node of nodes) {
    if (ts.isIdentifier(node)) {
      switch (node.text) {
        case "requireAuth":
          notes.add("requires auth");
          break;
        case "adminIPGuard":
          notes.add("admin IP guard");
          break;
        case "authRateLimit":
          notes.add("auth rate limited");
          break;
        case "rateLimit":
          notes.add("rate limited");
          break;
        case "requireInternalSignature":
        case "requireAdmin":
          notes.add("restricted access");
          break;
        default:
          break;
      }
    } else if (ts.isCallExpression(node)) {
      const callee = node.expression;
      if (ts.isIdentifier(callee) && callee.text === "auditMiddleware") {
        const arg = node.arguments[0];
        const context = arg && ts.isStringLiteralLike(arg) ? arg.text : undefined;
        notes.add(`audited${context ? ` (${context})` : ""}`);
      } else if (ts.isIdentifier(callee) && callee.text === "raw") {
        notes.add("raw body parser");
      }
    }
  }
  return Array.from(notes);
};

const deriveDomainFromBase = basePath => {
  if (!basePath) return undefined;
  const segments = basePath.split("/").filter(Boolean);
  if (!segments.length) return undefined;
  if (segments[0] === "api" && segments[1]) {
    return segments[1];
  }
  return segments[segments.length - 1];
};

const guessDomainFromFile = filePath => {
  if (!filePath) return undefined;
  const parsed = path.parse(filePath);
  if (parsed.name === "index" && parsed.dir) {
    return path.basename(parsed.dir);
  }
  return parsed.name;
};

const routerMounts = new Map();
const directRoutes = [];

const joinPaths = (basePath = "", routePath = "") => {
  const base = (basePath || "").trim();
  const relative = (routePath || "").trim();

  if (!base && !relative) return "/";
  if (!base) {
    if (!relative) return "/";
    return relative.startsWith("/") ? relative : `/${relative}`;
  }

  const trimmedBase = base === "/" ? "" : base.endsWith("/") ? base.slice(0, -1) : base;
  if (!relative || relative === "/") {
    return trimmedBase || "/";
  }
  const prefix = relative.startsWith("/") ? "" : "/";
  return `${trimmedBase}${prefix}${relative}`;
};

const normalizePath = value => {
  if (!value) return "/";
  let pathValue = value;
  if (!pathValue.startsWith("/")) {
    pathValue = `/${pathValue}`;
  }
  pathValue = pathValue.replace(/\/\/+/g, "/");
  if (pathValue.length > 1 && pathValue.endsWith("/")) {
    pathValue = pathValue.slice(0, -1);
  }
  return pathValue;
};

const inferDomain = (fullPath, fallback) => {
  const segments = fullPath.split("/").filter(Boolean);
  if (!segments.length) {
    return fallback ?? "root";
  }
  if (segments[0] === "api" && segments[1]) {
    return segments[1];
  }
  return segments[0] ?? fallback ?? "root";
};

const visitServer = node => {
  if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
    const expression = node.expression;
    if (ts.isIdentifier(expression.expression) && expression.expression.text === "app") {
      const method = expression.name.text;
      if (method === "use") {
        handleAppUse(node);
      } else if (HTTP_METHODS.has(method.toUpperCase())) {
        handleAppRoute(node, method.toUpperCase());
      }
    }
  }
  ts.forEachChild(node, visitServer);
};

const handleAppUse = callNode => {
  const args = callNode.arguments;
  let routerIndex = -1;
  for (let i = args.length - 1; i >= 0; i -= 1) {
    const arg = args[i];
    if (ts.isIdentifier(arg) && importMap.has(arg.text)) {
      routerIndex = i;
      break;
    }
  }
  if (routerIndex === -1) {
    return;
  }
  const routerIdentifier = args[routerIndex].text;
  const importEntry = importMap.get(routerIdentifier);
  if (!importEntry?.filePath) {
    return;
  }

  const existing = routerMounts.get(routerIdentifier) ?? {
    basePath: "",
    baseNotes: [],
    filePath: importEntry.filePath,
    routerName: routerIdentifier,
    domainFallback: guessDomainFromFile(importEntry.filePath),
  };

  const argsBeforeRouter = Array.from(args).slice(0, routerIndex);
  const basePathArg = argsBeforeRouter.find(arg => ts.isStringLiteralLike(arg) || ts.isNoSubstitutionTemplateLiteral(arg));
  const basePathValue = basePathArg ? basePathArg.text : existing.basePath;
  const middlewareNodes = argsBeforeRouter.filter(arg => arg !== basePathArg);
  const middlewareNotes = deriveNotesFromNodes(middlewareNodes, serverSource);
  const combinedNotes = Array.from(new Set([...(existing.baseNotes ?? []), ...middlewareNotes]));
  const domainFallback = deriveDomainFromBase(basePathValue) ?? existing.domainFallback;

  routerMounts.set(routerIdentifier, {
    ...existing,
    basePath: basePathValue,
    baseNotes: combinedNotes,
    domainFallback,
  });
};

const handleAppRoute = (callNode, method) => {
  const args = callNode.arguments;
  const firstArg = args[0];
  if (!firstArg || (!ts.isStringLiteralLike(firstArg) && !ts.isNoSubstitutionTemplateLiteral(firstArg))) {
    return;
  }
  const pathValue = normalizePath(firstArg.text);
  const extraArgs = Array.from(args).slice(1);
  const notes = deriveNotesFromNodes(extraArgs, serverSource);
  directRoutes.push({
    method,
    path: pathValue,
    notes,
    handlerFile: toPosixPath(path.relative(ROOT, SERVER_FILE)),
    domain: inferDomain(pathValue, "server"),
  });
};

visitServer(serverSource);

const extractRouterRoutes = routerInfo => {
  if (!routerInfo.filePath || !fs.existsSync(routerInfo.filePath)) {
    console.warn(`Skipping router ${routerInfo.routerName}: file not found (${routerInfo.filePath})`);
    return [];
  }
  const sourceFile = createSourceFile(routerInfo.filePath);
  const routes = [];
  const candidateNames = new Set([routerInfo.routerName]);

  const discoverRouterIdentifiers = node => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      ts.isCallExpression(node.initializer)
    ) {
      const callee = node.initializer.expression;
      if (
        (ts.isIdentifier(callee) && callee.text === "Router") ||
        (ts.isPropertyAccessExpression(callee) &&
          ts.isIdentifier(callee.expression) &&
          callee.expression.text === "express" &&
          callee.name.text === "Router")
      ) {
        candidateNames.add(node.name.text);
      }
    }
    ts.forEachChild(node, discoverRouterIdentifiers);
  };

  discoverRouterIdentifiers(sourceFile);

  const visit = node => {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const propertyAccess = node.expression;
      if (ts.isIdentifier(propertyAccess.expression) && candidateNames.has(propertyAccess.expression.text)) {
        const method = propertyAccess.name.text.toUpperCase();
        if (!HTTP_METHODS.has(method)) {
          return;
        }
        const firstArg = node.arguments[0];
        if (!firstArg) {
          return;
        }
        let pathValue = "";
        if (ts.isStringLiteralLike(firstArg) || ts.isNoSubstitutionTemplateLiteral(firstArg)) {
          pathValue = firstArg.text;
        } else {
          pathValue = firstArg.getText(sourceFile);
        }

        const extraArgs = Array.from(node.arguments).slice(1);
        const routeNotes = deriveNotesFromNodes(extraArgs, sourceFile);
        const combinedNotes = Array.from(new Set([...(routerInfo.baseNotes ?? []), ...routeNotes]));
        const combinedPath = normalizePath(joinPaths(routerInfo.basePath, pathValue));
        const domain = inferDomain(combinedPath, routerInfo.domainFallback);

        routes.push({
          method,
          path: combinedPath,
          domain,
          notes: combinedNotes,
          handlerFile: toPosixPath(path.relative(ROOT, routerInfo.filePath)),
        });
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return routes;
};

const routerEntries = Array.from(routerMounts.values()).flatMap(extractRouterRoutes);

const trpcRoutes = [];

const extractTrpcRoutes = () => {
  if (!fs.existsSync(TRPC_ROUTER_FILE)) {
    return;
  }
  const trpcSource = createSourceFile(TRPC_ROUTER_FILE);
  const trpcImportMap = new Map();

  trpcSource.forEachChild(node => {
    if (!ts.isImportDeclaration(node) || node.importClause?.isTypeOnly) return;
    const specifier = node.moduleSpecifier.getText(trpcSource).slice(1, -1);
    if (!specifier.startsWith(".")) return;
    const resolved =
      resolveModulePath(TRPC_ROUTER_FILE, specifier) ??
      path.resolve(path.dirname(TRPC_ROUTER_FILE), specifier.replace(/\.js$/, ".ts"));
    if (node.importClause?.name) {
      trpcImportMap.set(node.importClause.name.text, resolved);
    }
    if (node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
      node.importClause.namedBindings.elements.forEach(element => {
        trpcImportMap.set(element.name.text, resolved);
      });
    }
  });

  const routerDeclarations = [];

  const visit = node => {
    if (
      ts.isVariableDeclaration(node) &&
      node.name.getText(trpcSource) === "appRouter" &&
      node.initializer &&
      ts.isCallExpression(node.initializer) &&
      ts.isIdentifier(node.initializer.expression) &&
      node.initializer.expression.text === "createTRPCRouter"
    ) {
      const arg = node.initializer.arguments[0];
      if (arg && ts.isObjectLiteralExpression(arg)) {
        routerDeclarations.push(arg);
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(trpcSource);

  const collectProcedures = (filePath, exportedName, namespace) => {
    if (!filePath || !fs.existsSync(filePath)) {
      console.warn(`Missing tRPC router file for ${namespace}: ${filePath}`);
      return [];
    }
    const sourceFile = createSourceFile(filePath);
    let targetLiteral;

    const finder = node => {
      if (
        ts.isVariableDeclaration(node) &&
        node.name.getText(sourceFile) === exportedName &&
        node.initializer &&
        ts.isCallExpression(node.initializer) &&
        ts.isIdentifier(node.initializer.expression) &&
        node.initializer.expression.text === "createTRPCRouter"
      ) {
        const firstArg = node.initializer.arguments[0];
        if (firstArg && ts.isObjectLiteralExpression(firstArg)) {
          targetLiteral = firstArg;
        }
      }
      ts.forEachChild(node, finder);
    };

    finder(sourceFile);
    if (!targetLiteral) {
      return [];
    }

    return targetLiteral.properties
      .filter(prop => ts.isPropertyAssignment(prop))
      .map(prop => {
        const name = prop.name.getText(sourceFile);
        const initializer = prop.initializer;
        const rawText = initializer.getText(sourceFile);
        let kind = "TRPC.query";
        if (rawText.includes(".mutation")) {
          kind = "TRPC.mutation";
        } else if (rawText.includes(".query")) {
          kind = "TRPC.query";
        }
        const notes = [];
        if (rawText.includes("protectedProcedure")) {
          notes.push("requires auth");
        }
        if (rawText.includes("publicProcedure")) {
          notes.push("public");
        }
        if (rawText.includes("loggedProcedure")) {
          notes.push("logged");
        }
        return {
          method: kind,
          path: `trpc.${namespace}.${name}`,
          domain: `trpc.${namespace}`,
          handlerFile: toPosixPath(path.relative(ROOT, filePath)),
          notes,
        };
      });
  };

  routerDeclarations.forEach(literal => {
    literal.properties.forEach(prop => {
      if (!ts.isPropertyAssignment(prop)) return;
      const namespace = prop.name.getText(trpcSource);
      const routerIdentifier = prop.initializer.getText(trpcSource);
      const routerFile = trpcImportMap.get(routerIdentifier);
      const procedures = collectProcedures(routerFile, routerIdentifier, namespace);
      trpcRoutes.push(...procedures);
    });
  });
};

extractTrpcRoutes();

const routeIndex = [...routerEntries, ...directRoutes, ...trpcRoutes].sort((a, b) => {
  if (a.path === b.path) {
    return a.method.localeCompare(b.method);
  }
  return a.path.localeCompare(b.path);
});

const flattenPostmanItems = (items, parentFolders = []) => {
  const results = [];
  if (!Array.isArray(items)) {
    return results;
  }
  items.forEach(item => {
    if (item.item) {
      results.push(...flattenPostmanItems(item.item, [...parentFolders, item.name]));
    } else if (item.request) {
      const req = item.request;
      const method = (req.method || "GET").toUpperCase();
      const { path: reqPath } = normalizePostmanUrl(req.url);
      results.push({
        name: item.name,
        method,
        path: reqPath,
        folder: parentFolders.join(" / "),
      });
    }
  });
  return results;
};

const normalizePostmanUrl = url => {
  if (!url) return { path: "/" };
  if (typeof url === "string") {
    return { path: sanitizeRawPath(url) };
  }
  if (url.raw) {
    return { path: sanitizeRawPath(url.raw) };
  }
  if (Array.isArray(url.path)) {
    const joined = `/${url.path.join("/")}`;
    return { path: sanitizeRawPath(joined) };
  }
  return { path: "/" };
};

const sanitizeRawPath = raw => {
  if (!raw) return "/";
  let pathPart = raw;
  pathPart = pathPart.replace(/^https?:\/\/[^/]+/i, "");
  pathPart = pathPart.replace(/^{{\s*base_url\s*}}/i, "");
  pathPart = pathPart.replace(/^{{\s*BASE_URL\s*}}/i, "");
  pathPart = pathPart.replace(/^{{\s*api_base_url\s*}}/i, "");
  pathPart = pathPart.replace(/^{{\s*host\s*}}/i, "");
  const [clean] = pathPart.split("?");
  let normalized = clean || "/";
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }
  normalized = normalized.replace(/\/+/g, "/");
  normalized = normalized.replace(/{{\s*([^}]+)\s*}}/g, (_match, group) => `:${group.trim()}`);
  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
};

const postmanCollection = JSON.parse(fs.readFileSync(POSTMAN_COLLECTION_FILE, "utf8"));
const postmanRequests = flattenPostmanItems(postmanCollection.item ?? []);

const splitPathSegments = value => value.split("/").filter(Boolean);

const segmentsMatch = (routeSegments, requestSegments) => {
  if (routeSegments.length !== requestSegments.length) {
    return false;
  }
  for (let i = 0; i < routeSegments.length; i += 1) {
    const routeSegment = routeSegments[i];
    const requestSegment = requestSegments[i];
    const routeIsParam = routeSegment.startsWith(":");
    const requestIsParam = requestSegment.startsWith(":");
    if (routeIsParam || requestIsParam) {
      continue;
    }
    if (routeSegment !== requestSegment) {
      return false;
    }
  }
  return true;
};

const pathsMatch = (routePath, requestPath) => {
  const routeSegments = splitPathSegments(routePath);
  const requestSegments = splitPathSegments(requestPath);
  if (segmentsMatch(routeSegments, requestSegments)) {
    return true;
  }
  if (routeSegments[0] === "api" && segmentsMatch(routeSegments.slice(1), requestSegments)) {
    return true;
  }
  if (requestSegments[0] === "api" && segmentsMatch(routeSegments, requestSegments.slice(1))) {
    return true;
  }
  return false;
};

const coverageMatrix = {};

routeIndex.forEach(route => {
  if (!route.path.startsWith("/api") && !route.path.startsWith("/auth") && !route.path.startsWith("/metrics") && !route.path.startsWith("/brand") && !route.path.startsWith("/content") && !route.path.startsWith("/health")) {
    // Keep non-standard routes but allow coverage detection attempts
  }
  const match = postmanRequests.find(
    request => request.method === route.method && pathsMatch(route.path, request.path),
  );
  coverageMatrix[`${route.method} ${route.path}`] = {
    covered: Boolean(match),
    postmanRequestName: match?.name ?? null,
    folder: match?.folder ?? null,
    domain: route.domain,
    handlerFile: route.handlerFile,
  };
});

const writeJson = (filePath, data) => {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
};

writeJson(path.join(OUTPUT_DIR, "ROUTE_INDEX.json"), routeIndex);
writeJson(path.join(OUTPUT_DIR, "COVERAGE_MATRIX.json"), coverageMatrix);

console.log(`Generated ${routeIndex.length} routes`);
console.log(`Coverage entries: ${Object.keys(coverageMatrix).length}`);
