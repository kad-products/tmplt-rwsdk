variable "kad_workflow_automation" {
  description = "Fine-grained PAT used by Renovate, Semantic Release, and Interaction Limits workflows"
  type        = string
  sensitive   = true
}
