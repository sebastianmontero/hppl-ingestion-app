tee migration.hcl <<EOF
storage_source "file" {
  path = "/vault/file"
}

storage_destination "file" {
  path = "/vlt/file"
}
EOF
