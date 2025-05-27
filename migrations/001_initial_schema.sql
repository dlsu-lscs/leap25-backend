-- Migrations table
CREATE TABLE IF NOT EXISTS migrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  version VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  google_id VARCHAR(255) UNIQUE,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  display_picture VARCHAR(2083),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_google_id (google_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Organizations table
CREATE TABLE IF NOT EXISTS orgs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  org_logo VARCHAR(2083),
  org_url VARCHAR(2083),
  contentful_id VARCHAR(180),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_orgs_contentful_id (contentful_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subthemes table
CREATE TABLE IF NOT EXISTS subthemes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  logo_pub_url VARCHAR(2083),
  background_pub_url VARCHAR(2083),
  contentful_id VARCHAR(180),
  short_desc VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_subthemes_contentful_id (contentful_id),
  INDEX idx_subthemes_title (title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  org_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description VARCHAR(255),
  subtheme_id INT,
  venue VARCHAR(128),
  schedule DATETIME,
  schedule_end DATETIME,
  fee DECIMAL(10, 2) DEFAULT 0,
  code VARCHAR(50),
  registered_slots INT DEFAULT 0,
  max_slots INT NOT NULL,
  contentful_id VARCHAR(180),
  slug VARCHAR(80),
  gforms_url VARCHAR(2083),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES orgs(id) ON DELETE CASCADE,
  FOREIGN KEY (subtheme_id) REFERENCES subthemes(id) ON DELETE SET NULL,
  UNIQUE KEY (code),
  UNIQUE KEY (slug),
  INDEX idx_events_contentful_id (contentful_id),
  INDEX idx_events_title (title),
  INDEX idx_events_schedule (schedule),
  INDEX idx_events_subtheme_id (subtheme_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Registrations table
CREATE TABLE IF NOT EXISTS registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  event_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  UNIQUE KEY (user_id, event_id),
  INDEX idx_registrations_event_id (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Highlight Events table
CREATE TABLE IF NOT EXISTS highlights (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  title_card TEXT,
  title_fallback VARCHAR(80) NOT NULL,
  bg_img VARCHAR(2083),
  short_desc VARCHAR(255) NOT NULL,
  color VARCHAR(50) NOT NULL,
  contentful_id VARCHAR(180) NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  INDEX idx_highlights_contentful_id (contentful_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Event pubs table
CREATE TABLE IF NOT EXISTS event_pubs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT,
  pub_as_bg BOOLEAN,
  pub_url VARCHAR(2083),
  contentful_id VARCHAR(180),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  INDEX idx_event_pubs_contentful_id (contentful_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User bookmarked events table
CREATE TABLE IF NOT EXISTS bookmarks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY (user_id, event_id),
  INDEX idx_bookmarks_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO migrations (version) VALUES ('001_initial_schema');
