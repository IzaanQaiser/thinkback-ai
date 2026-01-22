"""
AI Chat Service with OpenAI Tool Calling for Semantic Search

This module provides an AI-powered chat interface that can search through
user's saved entries using natural language understanding and tool calling.
"""

import json
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from openai import OpenAI
import numpy as np
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
backend_dir = Path(__file__).parent
load_dotenv(backend_dir / ".env")

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Tool definitions for OpenAI function calling
CHAT_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_entries",
            "description": "Search user's saved entries using semantic understanding. Use this when the user wants to find specific content based on topic, keywords, or description.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Natural language search query describing what to find"
                    },
                    "platform": {
                        "type": "string",
                        "enum": ["youtube", "tiktok", "instagram", "reddit", "twitter", "linkedin"],
                        "description": "Optional: filter by specific platform"
                    },
                    "days_ago": {
                        "type": "integer",
                        "description": "Optional: only search entries from the last N days"
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_entry_details",
            "description": "Get full details of a specific saved entry by its ID",
            "parameters": {
                "type": "object",
                "properties": {
                    "entry_id": {
                        "type": "string",
                        "description": "The unique ID of the entry to retrieve"
                    }
                },
                "required": ["entry_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "filter_by_category",
            "description": "Get all entries that belong to a specific category",
            "parameters": {
                "type": "object",
                "properties": {
                    "category_name": {
                        "type": "string",
                        "description": "Name of the category to filter by"
                    }
                },
                "required": ["category_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_recent_entries",
            "description": "Get the most recently saved entries",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "Number of entries to return (default 5, max 10)"
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_favorites",
            "description": "Get all entries marked as favorites",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    }
]

# System prompt for the chat assistant
SYSTEM_PROMPT = """You are a helpful AI assistant for thinkback, a personal content vault where users save videos and posts from social media.

Your job is to help users find content they've saved. You have access to tools to search and filter their saved entries.

Guidelines:
- Be concise and friendly
- When you find entries, briefly describe what you found
- If no results are found, suggest alternative searches
- Use the search_entries tool for semantic/natural language queries
- Use filter_by_category for category-specific requests
- Use get_recent_entries when users ask about recent saves
- Use get_favorites when users ask about their favorites

When presenting results, format them clearly but briefly. The UI will display the actual entry cards.
"""


def sanitize_entry_for_json(entry: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert Firestore DatetimeWithNanoseconds and other non-serializable types
    to JSON-serializable formats.
    """
    sanitized = {}
    for key, value in entry.items():
        if hasattr(value, 'isoformat'):
            # Convert datetime objects to ISO string
            sanitized[key] = value.isoformat()
        elif isinstance(value, (list, tuple)):
            # Handle lists/tuples
            sanitized[key] = [
                v.isoformat() if hasattr(v, 'isoformat') else v 
                for v in value
            ]
        elif isinstance(value, dict):
            # Recursively handle nested dicts
            sanitized[key] = sanitize_entry_for_json(value)
        else:
            sanitized[key] = value
    return sanitized


def sanitize_entries_for_json(entries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Sanitize a list of entries for JSON serialization"""
    return [sanitize_entry_for_json(e) for e in entries]


def normalize_platform(platform: str) -> str:
    """Normalize platform names for consistent matching"""
    p = platform.lower().strip()
    if p in ['twitter', 'x', 'x.com']:
        return 'twitter'
    if 'youtube' in p:
        return 'youtube'
    if 'instagram' in p:
        return 'instagram'
    if 'reddit' in p:
        return 'reddit'
    if 'tiktok' in p:
        return 'tiktok'
    if 'linkedin' in p:
        return 'linkedin'
    return p


# Embedding cache to avoid redundant API calls within a single request
_embedding_cache: Dict[str, List[float]] = {}


def get_embedding(text: str) -> List[float]:
    """
    Get OpenAI embedding for a text string.
    Uses text-embedding-3-small for speed and cost efficiency.
    """
    # Check cache first
    if text in _embedding_cache:
        return _embedding_cache[text]
    
    # Clean and truncate text (max ~8000 tokens for safety)
    text = text.strip()
    if len(text) > 20000:
        text = text[:20000]
    
    if not text:
        # Return zero vector for empty text
        return [0.0] * 1536
    
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    
    embedding = response.data[0].embedding
    _embedding_cache[text] = embedding
    return embedding


def get_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """
    Get OpenAI embeddings for multiple texts in a single API call.
    Much more efficient than calling get_embedding() in a loop.
    """
    # Clean texts
    cleaned_texts = []
    for text in texts:
        text = text.strip()
        if len(text) > 20000:
            text = text[:20000]
        if not text:
            text = " "  # API doesn't accept empty strings
        cleaned_texts.append(text)
    
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=cleaned_texts
    )
    
    # Sort by index to maintain order
    sorted_data = sorted(response.data, key=lambda x: x.index)
    return [item.embedding for item in sorted_data]


def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Compute cosine similarity between two vectors."""
    a = np.array(vec1)
    b = np.array(vec2)
    
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    
    if norm_a == 0 or norm_b == 0:
        return 0.0
    
    return float(np.dot(a, b) / (norm_a * norm_b))


def get_entry_text(entry: Dict[str, Any]) -> str:
    """
    Combine entry fields into a single text for embedding.
    Prioritizes title, then summary, notes, tags, and channel.
    """
    parts = []
    
    title = entry.get('title', '')
    if title:
        parts.append(f"Title: {title}")
    
    summary = entry.get('summary', '')
    if summary:
        parts.append(f"Summary: {summary}")
    
    notes = entry.get('notes', '')
    if notes:
        parts.append(f"Notes: {notes}")
    
    tags = entry.get('tags', [])
    if tags:
        parts.append(f"Tags: {', '.join(tags)}")
    
    channel = entry.get('channel', '')
    if channel:
        parts.append(f"Channel: {channel}")
    
    return "\n".join(parts)


def search_entries_impl(
    entries: List[Dict[str, Any]],
    query: str,
    platform: Optional[str] = None,
    days_ago: Optional[int] = None
) -> List[Dict[str, Any]]:
    """
    Search entries using TRUE SEMANTIC SEARCH with OpenAI embeddings.
    
    This uses vector embeddings and cosine similarity to find entries
    that are semantically related to the query, even if they don't
    share exact keywords. For example, "F1" will match "Formula 1 racing"
    and "cooking recipes" will match food-related content.
    """
    if not entries:
        return []
    
    now = datetime.now()
    
    # Pre-filter entries by platform and date if specified
    filtered_entries = []
    for entry in entries:
        # Apply platform filter
        if platform:
            entry_platform = normalize_platform(entry.get('platform', ''))
            if entry_platform != normalize_platform(platform):
                continue
        
        # Apply date filter
        if days_ago:
            created_at = entry.get('created_at')
            if created_at:
                try:
                    if isinstance(created_at, str):
                        entry_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    elif hasattr(created_at, 'isoformat'):
                        entry_date = created_at
                    else:
                        continue
                    if (now - entry_date.replace(tzinfo=None)) > timedelta(days=days_ago):
                        continue
                except:
                    pass
        
        filtered_entries.append(entry)
    
    if not filtered_entries:
        return []
    
    # Get embedding for the user's query
    query_embedding = get_embedding(query)
    
    # Prepare entry texts for batch embedding
    entry_texts = [get_entry_text(entry) for entry in filtered_entries]
    
    # Get embeddings for all entries in a single batch call
    entry_embeddings = get_embeddings_batch(entry_texts)
    
    # Calculate similarity scores
    results = []
    for i, entry in enumerate(filtered_entries):
        similarity = cosine_similarity(query_embedding, entry_embeddings[i])
        results.append({
            'entry': entry,
            'score': similarity
        })
    
    # Sort by similarity score descending
    results.sort(key=lambda x: x['score'], reverse=True)
    
    # Filter by minimum similarity threshold and return top results
    # 0.3 is a reasonable threshold for semantic similarity
    min_threshold = 0.25
    matching = [r for r in results if r['score'] >= min_threshold]
    
    # Return top 10 results
    return [r['entry'] for r in matching[:10]]


def filter_by_category_impl(
    entries: List[Dict[str, Any]],
    categories: List[Dict[str, Any]],
    category_name: str
) -> List[Dict[str, Any]]:
    """Filter entries by category name"""
    # Find category ID by name (case-insensitive)
    category_id = None
    for cat in categories:
        if cat.get('name', '').lower() == category_name.lower():
            category_id = cat.get('id')
            break
    
    if not category_id:
        # Try partial matching (case-insensitive substring)
        search_name = category_name.lower()
        for cat in categories:
            cat_name = cat.get('name', '').lower()
            if search_name in cat_name or cat_name in search_name:
                category_id = cat.get('id')
                break
    
    if not category_id:
        return []
    
    return [e for e in entries if category_id in e.get('category_ids', [])]


def get_recent_entries_impl(
    entries: List[Dict[str, Any]],
    limit: int = 5
) -> List[Dict[str, Any]]:
    """Get most recent entries"""
    limit = min(max(1, limit), 10)  # Clamp between 1 and 10
    
    # Sort by created_at descending
    sorted_entries = sorted(
        entries,
        key=lambda x: x.get('created_at', ''),
        reverse=True
    )
    
    return sorted_entries[:limit]


def get_favorites_impl(entries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Get all favorited entries"""
    return [e for e in entries if e.get('favorite', False)]


def get_entry_details_impl(
    entries: List[Dict[str, Any]],
    entry_id: str
) -> Optional[Dict[str, Any]]:
    """Get a specific entry by ID"""
    for entry in entries:
        if entry.get('id') == entry_id:
            return entry
    return None


def execute_tool(
    tool_name: str,
    arguments: Dict[str, Any],
    entries: List[Dict[str, Any]],
    categories: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Execute a tool and return results"""
    
    if tool_name == "search_entries":
        results = search_entries_impl(
            entries,
            arguments.get('query', ''),
            arguments.get('platform'),
            arguments.get('days_ago')
        )
        return {
            "found": len(results),
            "entries": results
        }
    
    elif tool_name == "filter_by_category":
        results = filter_by_category_impl(
            entries,
            categories,
            arguments.get('category_name', '')
        )
        return {
            "found": len(results),
            "entries": results
        }
    
    elif tool_name == "get_recent_entries":
        results = get_recent_entries_impl(
            entries,
            arguments.get('limit', 5)
        )
        return {
            "found": len(results),
            "entries": results
        }
    
    elif tool_name == "get_favorites":
        results = get_favorites_impl(entries)
        return {
            "found": len(results),
            "entries": results
        }
    
    elif tool_name == "get_entry_details":
        entry = get_entry_details_impl(entries, arguments.get('entry_id', ''))
        if entry:
            return {"found": 1, "entries": [entry]}
        return {"found": 0, "entries": []}
    
    return {"error": f"Unknown tool: {tool_name}"}


async def process_chat_message(
    user_message: str,
    conversation_history: List[Dict[str, str]],
    entries: List[Dict[str, Any]],
    categories: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Process a chat message using OpenAI with tool calling.
    
    Returns:
        {
            "response": str,  # AI's text response
            "entries": List[Dict],  # Any entries referenced
            "tool_used": str | None  # Which tool was used, if any
        }
    """
    
    # Build messages array
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    
    # Add conversation history
    for msg in conversation_history[-10:]:  # Limit history to last 10 messages
        messages.append({
            "role": msg.get("role", "user"),
            "content": msg.get("content", "")
        })
    
    # Add current user message
    messages.append({"role": "user", "content": user_message})
    
    referenced_entries = []
    tool_used = None
    
    try:
        # First API call - may trigger tool use
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Use gpt-4o-mini for cost efficiency
            messages=messages,
            tools=CHAT_TOOLS,
            tool_choice="auto",
            max_tokens=500
        )
        
        assistant_message = response.choices[0].message
        
        # Check if the model wants to use tools
        if assistant_message.tool_calls:
            # Add the assistant's message with tool calls
            messages.append(assistant_message)
            
            # Execute each tool call
            for tool_call in assistant_message.tool_calls:
                tool_name = tool_call.function.name
                tool_used = tool_name
                
                try:
                    arguments = json.loads(tool_call.function.arguments)
                except json.JSONDecodeError:
                    arguments = {}
                
                # Execute the tool
                tool_result = execute_tool(tool_name, arguments, entries, categories)
                
                # Collect referenced entries
                if 'entries' in tool_result:
                    referenced_entries.extend(tool_result['entries'])
                
                # Sanitize tool result for JSON serialization (handles Firestore timestamps)
                sanitized_result = {
                    "found": tool_result.get("found", 0),
                    "entries": sanitize_entries_for_json(tool_result.get("entries", []))
                }
                
                # Add tool result to messages
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(sanitized_result)
                })
            
            # Second API call - get final response after tool execution
            final_response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                max_tokens=500
            )
            
            final_text = final_response.choices[0].message.content
        else:
            # No tool use, return direct response
            final_text = assistant_message.content
        
        # Sanitize entries before returning to frontend
        return {
            "response": final_text or "I couldn't process that request. Please try again.",
            "entries": sanitize_entries_for_json(referenced_entries[:10]),  # Limit to 10 entries
            "tool_used": tool_used
        }
        
    except Exception as e:
        print(f"Error in chat processing: {e}")
        return {
            "response": f"Sorry, I encountered an error: {str(e)}",
            "entries": [],
            "tool_used": None
        }
