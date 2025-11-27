"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDefaultAgents = registerDefaultAgents;
exports.resetRegisteredAgentsForTest = resetRegisteredAgentsForTest;
var registry_js_1 = require("./registry.js");
var types_js_1 = require("./types.js");
var ContentAgent_js_1 = require("../../agents/content/ContentAgent.js");
var SEOAgent_js_1 = require("../../agents/SEOAgent.js");
var EmailAgent_js_1 = require("../../agents/EmailAgent.js");
var SocialAgent_js_1 = require("../../agents/SocialAgent.js");
var SupportAgent_js_1 = require("../../agents/SupportAgent.js");
var orchestratorAgents = {
    ContentAgent: ContentAgent_js_1.contentAgent,
    SEOAgent: SEOAgent_js_1.seoAgent,
    EmailAgent: EmailAgent_js_1.emailAgent,
    SocialAgent: SocialAgent_js_1.socialAgent,
    SupportAgent: SupportAgent_js_1.supportAgent,
};
var registered = false;
function registerDefaultAgents() {
    if (registered) {
        return;
    }
    for (var _i = 0, _a = Object.entries(orchestratorAgents); _i < _a.length; _i++) {
        var _b = _a[_i], name_1 = _b[0], handler = _b[1];
        if (!handler)
            continue;
        var definition = types_js_1.AGENT_DEFINITIONS[name_1];
        (0, registry_js_1.registerAgent)(name_1, handler, {
            version: definition.version,
            capabilities: definition.intents,
        });
    }
    registered = true;
}
/** Test helper to allow re-registration between specs. */
function resetRegisteredAgentsForTest() {
    (0, registry_js_1.clearRegistry)();
    registered = false;
}
