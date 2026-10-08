variable "kad_github_token" {
  description = "Fine-grained PAT used by Renovate, Semantic Release, and Interaction Limits workflows"
  type        = string
  sensitive   = true
}

variable "repo_name" {
  description = "Repo name/slug from GitHub"
  type        = string
}
