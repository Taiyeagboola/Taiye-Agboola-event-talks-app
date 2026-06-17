import xml.etree.ElementTree as ET

tree = ET.parse('release_notes_sample.xml')
root = tree.getroot()

# Atom namespace
ns = {'atom': 'http://www.w3.org/2005/Atom'}

print("Feed Title:", root.find('atom:title', ns).text)
print("Feed Updated:", root.find('atom:updated', ns).text)

entries = root.findall('atom:entry', ns)
print(f"Total entries: {len(entries)}")

if entries:
    entry = entries[0]
    print("\nFirst Entry Details:")
    print("Title:", entry.find('atom:title', ns).text)
    print("ID:", entry.find('atom:id', ns).text)
    print("Updated:", entry.find('atom:updated', ns).text)
    content_el = entry.find('atom:content', ns)
    if content_el is not None:
        print("Content Type:", content_el.get('type'))
        print("Content (truncated):", content_el.text[:500] if content_el.text else "None")
