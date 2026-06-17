import os
import time
import requests
from flask import Flask, jsonify, render_template
from parser import parse_xml_feed

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
CACHE_DURATION_SECS = 1800  # Cache for 30 minutes

# Global in-memory cache
cache = {
    "data": [],
    "last_updated": 0
}

def get_release_notes(force_refresh=False):
    now = time.time()
    # Check if cache is fresh and not empty
    if not force_refresh and cache["data"] and (now - cache["last_updated"] < CACHE_DURATION_SECS):
        return cache["data"]
        
    try:
        response = requests.get(FEED_URL, timeout=10)
        response.raise_for_status()
        
        parsed_items = parse_xml_feed(response.text)
        if parsed_items:
            cache["data"] = parsed_items
            cache["last_updated"] = now
            return parsed_items
        else:
            if cache["data"]:
                return cache["data"]
            return []
    except Exception as e:
        print(f"Error fetching release notes from URL: {e}")
        # Fallback to cache if network fails
        if cache["data"]:
            return cache["data"]
        # Try to read local sample XML file if network is down and cache is empty
        try:
            if os.path.exists('release_notes_sample.xml'):
                with open('release_notes_sample.xml', 'r', encoding='utf-8') as f:
                    parsed_items = parse_xml_feed(f.read())
                    if parsed_items:
                        cache["data"] = parsed_items
                        cache["last_updated"] = now - (CACHE_DURATION_SECS - 300) # Force refresh check in 5 mins
                        return parsed_items
        except Exception as local_err:
            print("Local fallback reading failed:", local_err)
        return []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def api_release_notes():
    from flask import request
    force_refresh = request.args.get('refresh') == 'true'
    notes = get_release_notes(force_refresh=force_refresh)
    
    # Extract categories and their counts for filtering UI
    categories = {}
    for note in notes:
        cat = note['category']
        categories[cat] = categories.get(cat, 0) + 1
        
    return jsonify({
        "status": "success",
        "count": len(notes),
        "categories": categories,
        "notes": notes
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
