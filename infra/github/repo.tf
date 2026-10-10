module "repo" {
  source = "github.com/kad-products/platform//open-tofu/modules/github-repo?ref=v1.21.0"

  repo_name        = var.repo_name
  repo_description = "RedwoodSDK Template repo"
  is_product       = true
  is_template      = true
  required_checks = [
    "test-cli / run-tests",
    "lint-cli / lint-code",
    "lint-code / lint-code",
    "plan-github-setup / plan-open-tofu",
    "create-release-dry-run / create-release-dry-run",
  ]
}
