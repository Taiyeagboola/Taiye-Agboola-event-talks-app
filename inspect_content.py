import xml.etree.ElementTree as ET

tree = ET.parse('release_notes_sample.xml')
root = tree.getroot()
ns = {'atom': 'http://www.w3.org/2005/Atom'}

for i, entry in enumerate(root.findall('atom:entry', ns)[:3]):
    title = entry.find('atom:title', ns).text
    content = entry.find('atom:content', ns).text
    print(f"\n--- Entry {i+1}: {title} ---")
    print(content)
