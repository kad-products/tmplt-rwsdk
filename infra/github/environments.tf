module "environments" {
  source   = "github.com/kad-products/platform//open-tofu/modules/github-environment?ref=v1.9.0"
  for_each = toset(["integration", "staging", "production"])

  repo_name        = "tmplt-rwsdk"
  environment_name = each.key
}
