import urllib.request

url = 'https://docs.cloud.google.com/feeds/bigquery-release-notes.xml'
try:
    response = urllib.request.urlopen(url)
    data = response.read()
    with open('release_notes_sample.xml', 'wb') as f:
        f.write(data)
    print("Successfully fetched the release notes feed!")
    print("Length:", len(data), "bytes")
    # print first 500 chars of data
    print("Sample:\n", data[:500].decode('utf-8'))
except Exception as e:
    print("Error fetching release notes:", e)
