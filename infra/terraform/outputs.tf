output "project_id" {
  description = "GCP Project ID"
  value       = var.project_id
}

output "region" {
  description = "GCP Region"
  value       = var.region
}

output "firestore_database" {
  description = "Firestore database name"
  value       = google_firestore_database.database.name
}

output "pubsub_topics" {
  description = "Pub/Sub topic names"
  value = {
    diary_saved  = google_pubsub_topic.diary_saved.name
    chat_saved   = google_pubsub_topic.chat_saved.name
    mood_logged  = google_pubsub_topic.mood_logged.name
    risk_flagged = google_pubsub_topic.risk_flagged.name
  }
}

output "bigquery_dataset" {
  description = "BigQuery dataset ID"
  value       = google_bigquery_dataset.sukoon_dataset.dataset_id
}

output "storage_buckets" {
  description = "Cloud Storage bucket names"
  value = {
    text_storage = google_storage_bucket.sukoon_text_storage.name
    insights     = google_storage_bucket.sukoon_insights.name
  }
}

output "kms_keyring" {
  description = "KMS Key Ring name"
  value       = google_kms_key_ring.sukoon_keyring.name
}

output "service_accounts" {
  description = "Service account emails"
  value = {
    backend  = google_service_account.sukoon_backend.email
    dataflow = google_service_account.sukoon_dataflow.email
  }
}
