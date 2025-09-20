terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Firestore Database
resource "google_firestore_database" "database" {
  project     = var.project_id
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"

  depends_on = [google_project_service.firestore]
}

# Pub/Sub Topics
resource "google_pubsub_topic" "diary_saved" {
  name = "diary.saved"

  depends_on = [google_project_service.pubsub]
}

resource "google_pubsub_topic" "chat_saved" {
  name = "chat.saved"

  depends_on = [google_project_service.pubsub]
}

resource "google_pubsub_topic" "mood_logged" {
  name = "mood.logged"

  depends_on = [google_project_service.pubsub]
}

resource "google_pubsub_topic" "risk_flagged" {
  name = "risk.flagged"

  depends_on = [google_project_service.pubsub]
}

# Dead letter topics
resource "google_pubsub_topic" "diary_saved_dlq" {
  name = "diary.saved.dlq"

  depends_on = [google_project_service.pubsub]
}

resource "google_pubsub_topic" "chat_saved_dlq" {
  name = "chat.saved.dlq"

  depends_on = [google_project_service.pubsub]
}

resource "google_pubsub_topic" "mood_logged_dlq" {
  name = "mood.logged.dlq"

  depends_on = [google_project_service.pubsub]
}

resource "google_pubsub_topic" "risk_flagged_dlq" {
  name = "risk.flagged.dlq"

  depends_on = [google_project_service.pubsub]
}

# Pub/Sub Subscriptions for Dataflow
resource "google_pubsub_subscription" "diary_saved_sub" {
  name  = "diary-saved-subscription"
  topic = google_pubsub_topic.diary_saved.name

  ack_deadline_seconds = 60

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.diary_saved_dlq.id
    max_delivery_attempts = 5
  }

  depends_on = [google_project_service.pubsub]
}

resource "google_pubsub_subscription" "chat_saved_sub" {
  name  = "chat-saved-subscription"
  topic = google_pubsub_topic.chat_saved.name

  ack_deadline_seconds = 60

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.chat_saved_dlq.id
    max_delivery_attempts = 5
  }

  depends_on = [google_project_service.pubsub]
}

resource "google_pubsub_subscription" "mood_logged_sub" {
  name  = "mood-logged-subscription"
  topic = google_pubsub_topic.mood_logged.name

  ack_deadline_seconds = 60

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.mood_logged_dlq.id
    max_delivery_attempts = 5
  }

  depends_on = [google_project_service.pubsub]
}

resource "google_pubsub_subscription" "risk_flagged_sub" {
  name  = "risk-flagged-subscription"
  topic = google_pubsub_topic.risk_flagged.name

  ack_deadline_seconds = 60

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.risk_flagged_dlq.id
    max_delivery_attempts = 5
  }

  depends_on = [google_project_service.pubsub]
}

# BigQuery Dataset
resource "google_bigquery_dataset" "sukoon_dataset" {
  dataset_id    = "sukoon_analytics"
  friendly_name = "Sukoon Analytics"
  description   = "Analytics dataset for Sukoon AI MVP"
  location      = var.region

  depends_on = [google_project_service.bigquery]
}

# BigQuery Tables
resource "google_bigquery_table" "diary_entries" {
  dataset_id = google_bigquery_dataset.sukoon_dataset.dataset_id
  table_id   = "diary_entries"

  schema = jsonencode([
    {
      name = "userId"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "entryId"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "createdAt"
      type = "TIMESTAMP"
      mode = "REQUIRED"
    },
    {
      name = "textUri"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "lang"
      type = "STRING"
      mode = "NULLABLE"
    },
    {
      name = "sentiment"
      type = "FLOAT"
      mode = "NULLABLE"
    },
    {
      name = "processedAt"
      type = "TIMESTAMP"
      mode = "NULLABLE"
    }
  ])

  depends_on = [google_bigquery_dataset.sukoon_dataset]
}

resource "google_bigquery_table" "chat_turns" {
  dataset_id = google_bigquery_dataset.sukoon_dataset.dataset_id
  table_id   = "chat_turns"

  schema = jsonencode([
    {
      name = "userId"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "chatId"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "turnId"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "createdAt"
      type = "TIMESTAMP"
      mode = "REQUIRED"
    },
    {
      name = "textUri"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "lang"
      type = "STRING"
      mode = "NULLABLE"
    },
    {
      name = "sentiment"
      type = "FLOAT"
      mode = "NULLABLE"
    },
    {
      name = "riskLevel"
      type = "STRING"
      mode = "NULLABLE"
    },
    {
      name = "processedAt"
      type = "TIMESTAMP"
      mode = "NULLABLE"
    }
  ])

  depends_on = [google_bigquery_dataset.sukoon_dataset]
}

resource "google_bigquery_table" "mood_events" {
  dataset_id = google_bigquery_dataset.sukoon_dataset.dataset_id
  table_id   = "mood_events"

  schema = jsonencode([
    {
      name = "userId"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "eventId"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "createdAt"
      type = "TIMESTAMP"
      mode = "REQUIRED"
    },
    {
      name = "moodScore"
      type = "FLOAT"
      mode = "REQUIRED"
    },
    {
      name = "notes"
      type = "STRING"
      mode = "NULLABLE"
    },
    {
      name = "processedAt"
      type = "TIMESTAMP"
      mode = "NULLABLE"
    }
  ])

  depends_on = [google_bigquery_dataset.sukoon_dataset]
}

# Cloud Storage Buckets
resource "google_storage_bucket" "sukoon_text_storage" {
  name          = "${var.project_id}-sukoon-text"
  location      = var.region
  force_destroy = true

  uniform_bucket_level_access = true

  depends_on = [google_project_service.storage]
}

resource "google_storage_bucket" "sukoon_insights" {
  name          = "${var.project_id}-sukoon-insights"
  location      = var.region
  force_destroy = true

  uniform_bucket_level_access = true

  depends_on = [google_project_service.storage]
}

# KMS Key Ring and Keys
resource "google_kms_key_ring" "sukoon_keyring" {
  name     = "sukoon-keyring"
  location = var.region

  depends_on = [google_project_service.kms]
}

resource "google_kms_crypto_key" "text_encryption_key" {
  name     = "text-encryption-key"
  key_ring = google_kms_key_ring.sukoon_keyring.id

  depends_on = [google_kms_key_ring.sukoon_keyring]
}

# Service Accounts
resource "google_service_account" "sukoon_backend" {
  account_id   = "sukoon-backend"
  display_name = "Sukoon Backend Service Account"

  depends_on = [google_project_service.iam]
}

resource "google_service_account" "sukoon_dataflow" {
  account_id   = "sukoon-dataflow"
  display_name = "Sukoon Dataflow Service Account"

  depends_on = [google_project_service.iam]
}

# IAM Bindings
resource "google_project_iam_member" "backend_firestore" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.sukoon_backend.email}"

  depends_on = [google_service_account.sukoon_backend]
}

resource "google_project_iam_member" "backend_pubsub" {
  project = var.project_id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.sukoon_backend.email}"

  depends_on = [google_service_account.sukoon_backend]
}

resource "google_project_iam_member" "backend_storage" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.sukoon_backend.email}"

  depends_on = [google_service_account.sukoon_backend]
}

resource "google_project_iam_member" "backend_kms" {
  project = var.project_id
  role    = "roles/cloudkms.cryptoKeyEncrypterDecrypter"
  member  = "serviceAccount:${google_service_account.sukoon_backend.email}"

  depends_on = [google_service_account.sukoon_backend]
}

resource "google_project_iam_member" "backend_vertex" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.sukoon_backend.email}"

  depends_on = [google_service_account.sukoon_backend]
}

resource "google_project_iam_member" "dataflow_pubsub" {
  project = var.project_id
  role    = "roles/pubsub.subscriber"
  member  = "serviceAccount:${google_service_account.sukoon_dataflow.email}"

  depends_on = [google_service_account.sukoon_dataflow]
}

resource "google_project_iam_member" "dataflow_bigquery" {
  project = var.project_id
  role    = "roles/bigquery.dataEditor"
  member  = "serviceAccount:${google_service_account.sukoon_dataflow.email}"

  depends_on = [google_service_account.sukoon_dataflow]
}

resource "google_project_iam_member" "dataflow_storage" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.sukoon_dataflow.email}"

  depends_on = [google_service_account.sukoon_dataflow]
}

resource "google_project_iam_member" "dataflow_dataflow" {
  project = var.project_id
  role    = "roles/dataflow.worker"
  member  = "serviceAccount:${google_service_account.sukoon_dataflow.email}"

  depends_on = [google_service_account.sukoon_dataflow]
}

# Enable required APIs
resource "google_project_service" "firestore" {
  service = "firestore.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "pubsub" {
  service = "pubsub.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "bigquery" {
  service = "bigquery.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "storage" {
  service = "storage.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "kms" {
  service = "cloudkms.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "iam" {
  service = "iam.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "run" {
  service = "run.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "dataflow" {
  service = "dataflow.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "vertex" {
  service = "aiplatform.googleapis.com"
  disable_on_destroy = false
}
