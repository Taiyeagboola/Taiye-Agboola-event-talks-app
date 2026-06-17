# BigQuery Release Notes Explorer

A premium, interactive web dashboard to explore, search, and filter Google Cloud BigQuery release notes. It fetches and parses the official Atom release notes feed, offering a cleaner, more structured interface than the raw feed list.

## 🚀 Features

* **Atom Feed Parsing**: Downloads the live Google Cloud BigQuery Atom feed and parses it. It breaks down daily updates into individual items by parsing headers (`<h3>`), making individual features, issues, and deprecations searchable.
* **Intelligent Caching & Failover**: Caches the parsed data locally in-memory for 30 minutes to optimize speed. If the network or official feed is unavailable, it automatically falls back to a pre-saved local XML snapshot (`release_notes_sample.xml`).
* **Real-time Filters & Search**:
  * Case-insensitive keyword search across updates.
  * Category-based filter pills (Feature, Change, Issue, Deprecated) with dynamic count badges.
  * Chronological sorting (Newest first or Oldest first).
* **Premium Dark-Theme Interface**: Styled with Google Fonts (Outfit & Plus Jakarta Sans) and Lucide Icons. Features a modern dashboard aesthetic with responsive layouts, smooth transitions, glowing accent orbs, and skeleton loading screens.

## 🛠️ Architecture

* **Backend**: 
  * [Flask](https://flask.palletsprojects.com/) (Python web framework)
  * `BeautifulSoup4` (HTML parsing)
  * `xml.etree.ElementTree` (Atom feed navigation)
  * `requests` (Feed fetching)
* **Frontend**:
  * Vanilla HTML5, CSS3, and JavaScript (ES6)
  * [Lucide Icons](https://lucide.dev/) (Icons package)

## 📁 File Structure

```text
├── app.py                     # Main Flask application (routes, API endpoints, caching)
├── parser.py                  # XML and BeautifulSoup parsing utilities
├── requirements.txt           # Python project dependencies
├── release_notes_sample.xml   # Local backup snapshot of the XML feed
├── templates/
│   └── index.html             # Main dashboard HTML structure
├── static/
│   ├── css/
│   │   └── styles.css         # Custom dark theme & glassmorphic styling
│   └── js/
│       └── app.js             # Client state management, filtering, search, and DOM rendering
└── utilities/                 # Diagnostics & maintenance scripts
    ├── fetch_feed.py          # Script to manual fetch and download live XML feed
    ├── inspect_content.py     # Script to view sample entry bodies
    └── parse_sample.py        # Diagnostic script to test feed parser locally
```

## ⚙️ Installation & Usage

### 1. Prerequisites
Ensure you have **Python 3.8+** installed.

### 2. Clone the Repository
```bash
git clone https://github.com/Taiyeagboola/Taiye-Agboola-event-talks-app.git
cd Taiye-Agboola-event-talks-app
```

### 3. Install Dependencies
Install the required packages using pip:
```bash
pip install -r requirements.txt
```

### 4. Run the Application
Start the Flask development server:
```bash
python app.py
```

### 5. Access the Dashboard
Open your web browser and navigate to:
```text
http://localhost:5000
```

## 🛡️ License

This project is open-source and available under the MIT License.
