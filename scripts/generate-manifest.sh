#!/bin/bash

# Generate manifest.json with SHA256 checksums for preservation
# Usage: ./scripts/generate-manifest.sh <directory> <output_file>

DIR="${1:-preservation/v3.0}"
OUTPUT="${2:-preservation/v3.0/manifest.json}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "Generating manifest for: $DIR"
echo "Output: $OUTPUT"

# Start JSON
cat > "$OUTPUT" << EOF
{
  "version": "3.0.0-production-final",
  "generated": "$TIMESTAMP",
  "description": "NeonHub v3.0 Production Snapshot - Frozen state for autonomous evolution baseline",
  "git_tag": "v3.0.0-production-final",
  "files": {
EOF

# Generate checksums
first=true
find "$DIR" -type f ! -name "manifest.json" | sort | while read -r file; do
    # Calculate SHA256
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        checksum=$(shasum -a 256 "$file" | awk '{print $1}')
    else
        # Linux
        checksum=$(sha256sum "$file" | awk '{print $1}')
    fi
    
    # Get relative path
    rel_path="${file#$DIR/}"
    
    # Add comma if not first entry
    if [ "$first" = false ]; then
        echo "," >> "$OUTPUT"
    fi
    first=false
    
    # Write JSON entry (without trailing newline for last entry)
    printf '    "%s": "%s"' "$rel_path" "$checksum" >> "$OUTPUT"
done

# Close JSON
cat >> "$OUTPUT" << EOF

  }
}
EOF

echo "✅ Manifest generated successfully!"
echo "Total files: $(jq '.files | length' "$OUTPUT")"