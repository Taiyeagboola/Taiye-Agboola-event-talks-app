import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
import re

def parse_xml_feed(xml_content):
    """
    Parses the Atom XML feed for BigQuery release notes and returns a list of release note items.
    Each item contains:
      - id: unique string identifier
      - date: display date (e.g. "June 15, 2026")
      - updated: timestamp string
      - category: release note type (e.g. "Feature", "Issue", "Change", "Deprecated")
      - content: HTML string of the note
      - plaintext: plain text content for search indexing
    """
    try:
        root = ET.fromstring(xml_content)
    except Exception as e:
        print("Error parsing XML content:", e)
        return []
        
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    items = []
    
    # Locate all <entry> tags in the Atom feed
    for entry_el in root.findall('atom:entry', ns):
        title_el = entry_el.find('atom:title', ns)
        title_text = title_el.text.strip() if title_el is not None and title_el.text else ""
        
        id_el = entry_el.find('atom:id', ns)
        id_text = id_el.text.strip() if id_el is not None and id_el.text else ""
        
        updated_el = entry_el.find('atom:updated', ns)
        updated_text = updated_el.text.strip() if updated_el is not None and updated_el.text else ""
        
        content_el = entry_el.find('atom:content', ns)
        content_html = content_el.text if content_el is not None and content_el.text else ""
        
        if not content_html:
            continue
            
        # Parse the HTML content to break it down by <h3> tags
        soup = BeautifulSoup(content_html, 'html.parser')
        
        current_category = "General"
        current_elements = []
        item_counter = 0
        
        for child in soup.contents:
            if child.name == 'h3':
                # Save previous group if it has content
                if current_elements:
                    raw_html = "".join(str(el) for el in current_elements).strip()
                    if raw_html:
                        soup_item = BeautifulSoup(raw_html, 'html.parser')
                        plaintext = soup_item.get_text().strip()
                        
                        items.append({
                            'id': f"{id_text}_{item_counter}",
                            'date': title_text,
                            'updated': updated_text,
                            'category': current_category,
                            'content': raw_html,
                            'plaintext': plaintext
                        })
                        item_counter += 1
                
                # Start new group
                current_category = child.get_text().strip()
                current_elements = []
            else:
                if child.name is not None or (isinstance(child, str) and child.strip()):
                    current_elements.append(child)
                    
        # Append the final group
        if current_elements:
            raw_html = "".join(str(el) for el in current_elements).strip()
            if raw_html:
                soup_item = BeautifulSoup(raw_html, 'html.parser')
                plaintext = soup_item.get_text().strip()
                items.append({
                    'id': f"{id_text}_{item_counter}",
                    'date': title_text,
                    'updated': updated_text,
                    'category': current_category,
                    'content': raw_html,
                    'plaintext': plaintext
                })
                
    return items
