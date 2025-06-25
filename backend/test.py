from ai import classify_entry

entry = {
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "notes": "A motivational video about persistence and never giving up.",
}
categories = [
    {"id": "GGRMp2VON2mUgMQoRnS0", "name": "Motivation"}
]  # or whatever categories you have
print(classify_entry(entry, categories))
