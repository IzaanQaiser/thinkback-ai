# AI Training Guide for Thinkback

## Overview

This guide outlines the different ways you can train and improve the AI classification system in Thinkback. The system currently uses OpenAI's GPT-4 model with sophisticated prompt engineering, but there are several ways to enhance its performance.

## Current AI Training Methods

### 1. **Prompt Engineering (Currently Implemented)**

Your system already uses advanced prompt engineering to "train" the AI:

#### Platform-Specific Guidance
```python
# Example from backend/ai.py
platform_guidance = """
YOUTUBE-SPECIFIC CATEGORIZATION:
- Use the video title as the primary source for categorization
- Consider the channel name and typical content type
- Examples:
  * "How to Make Perfect Pasta" → "Cooking" (not "Pasta Tutorial")
  * "NBA Highlights 2024" → "Basketball" (not "NBA Highlights")
"""
```

#### Thumbnail Integration
- **Visual context**: AI considers thumbnail content for better categorization
- **Platform-specific handling**: Different thumbnail strategies per platform
- **Fallback mechanisms**: Graceful handling when thumbnails are unavailable

#### Categorization Rules
- **Broad categories**: Prefer simple, broad categories over specific ones
- **Keyword matching**: Exact keyword matches in existing categories
- **Similarity scoring**: 80%+ similarity matching for existing categories

### 2. **User Feedback System (Newly Added)**

A feedback mechanism has been implemented to collect user corrections:

#### Backend API (`/api/ai-feedback`)
```python
@router.post("/api/ai-feedback")
def submit_ai_feedback(feedback: dict):
    # Collects:
    # - Entry ID
    # - Original category
    # - Suggested category
    # - Rating (1-5)
    # - Notes
    # - Feedback type
```

#### Frontend Integration
- **Feedback button**: Available on each content card
- **Rating system**: 1-5 star rating for AI performance
- **Category suggestions**: Users can suggest better categories
- **Notes field**: Additional context for improvements

## Advanced Training Options

### 3. **Fine-tuning with OpenAI**

You could collect training data and fine-tune a custom model:

#### Training Data Collection
```python
# Example training data format
training_data = [
    {
        "messages": [
            {"role": "system", "content": "You are an AI assistant for content categorization."},
            {"role": "user", "content": "URL: https://youtube.com/...\nTitle: React Tutorial\nCategory: Programming"},
            {"role": "assistant", "content": '{"category": {"name": "Programming"}, "tags": ["react", "tutorial"]}'}
        ]
    }
]
```

#### Implementation Steps
1. **Collect feedback data** from the new feedback system
2. **Format training examples** in OpenAI's fine-tuning format
3. **Upload to OpenAI** for fine-tuning
4. **Deploy custom model** with improved performance

### 4. **RAG (Retrieval-Augmented Generation)**

Implement a system that retrieves similar past entries:

#### Similarity Matching
```python
def get_similar_entries(entry, user_entries):
    """Find similar past entries to provide context to AI"""
    similar_entries = []
    
    # Use embeddings or fuzzy matching
    for past_entry in user_entries:
        similarity = calculate_similarity(entry, past_entry)
        if similarity > 0.8:
            similar_entries.append(past_entry)
    
    return similar_entries
```

#### Enhanced Prompts
```python
# Add similar examples to AI prompt
similar_examples = get_similar_entries(entry, user_entries)
examples_text = format_examples(similar_examples)

prompt = f"""
{base_prompt}

Similar entries from your library:
{examples_text}

Use these examples as guidance for categorization.
"""
```

### 5. **Embedding-Based Learning**

Store and use embeddings for better similarity matching:

#### Implementation
```python
from sentence_transformers import SentenceTransformer
import numpy as np

class ContentEmbedder:
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
    
    def get_embedding(self, text):
        return self.model.encode(text)
    
    def find_similar_content(self, query_embedding, stored_embeddings, threshold=0.8):
        similarities = np.dot(stored_embeddings, query_embedding)
        return similarities > threshold
```

## Implementation Roadmap

### Phase 1: User Feedback Collection (✅ Implemented)
- ✅ Backend API for feedback submission
- ✅ Frontend feedback modal
- ✅ Rating system and category suggestions

### Phase 2: Feedback Analysis (Next Steps)
```python
# Add to backend/ai.py
def analyze_feedback_patterns(user_id: str):
    """Analyze user feedback to improve AI prompts"""
    feedback_data = get_user_feedback(user_id)
    
    # Find common correction patterns
    corrections = [f for f in feedback_data if f['type'] == 'correction']
    
    # Update prompts based on patterns
    if corrections:
        update_ai_prompts(corrections)
```

### Phase 3: Dynamic Prompt Improvement
```python
def update_ai_prompts(corrections):
    """Dynamically update AI prompts based on feedback"""
    # Analyze correction patterns
    # Update platform-specific guidance
    # Add new examples to prompts
    # Improve categorization rules
```

### Phase 4: Fine-tuning Pipeline
```python
def prepare_fine_tuning_data():
    """Prepare feedback data for OpenAI fine-tuning"""
    feedback_data = get_all_feedback()
    
    training_examples = []
    for feedback in feedback_data:
        if feedback['rating'] >= 4:  # Only use high-quality feedback
            example = create_training_example(feedback)
            training_examples.append(example)
    
    return training_examples
```

## Benefits of Each Approach

### Prompt Engineering
- ✅ **Immediate**: No training time required
- ✅ **Cost-effective**: No additional API costs
- ✅ **Flexible**: Easy to update and iterate
- ❌ **Limited**: Can't learn from user-specific patterns

### User Feedback
- ✅ **Personalized**: Learns from individual user preferences
- ✅ **Continuous**: Improves over time
- ✅ **Actionable**: Direct feedback on AI performance
- ❌ **Manual**: Requires user input

### Fine-tuning
- ✅ **Powerful**: Can learn complex patterns
- ✅ **Customized**: Tailored to your specific use case
- ✅ **Scalable**: Works across all users
- ❌ **Expensive**: Requires significant training data and costs
- ❌ **Complex**: Requires ML expertise

### RAG
- ✅ **Contextual**: Uses user's own content as examples
- ✅ **Personalized**: Adapts to individual user's content
- ✅ **No training**: Works immediately
- ❌ **Limited scope**: Only works with existing user content

## Recommended Implementation Strategy

### For Immediate Improvement
1. **Deploy the feedback system** (already implemented)
2. **Collect user feedback** for 1-2 months
3. **Analyze patterns** in corrections and ratings
4. **Update prompts** based on common issues

### For Long-term Enhancement
1. **Implement RAG** for personalized context
2. **Add embedding-based similarity** for better matching
3. **Consider fine-tuning** once you have 1000+ high-quality feedback examples

### For Advanced Users
1. **Fine-tune a custom model** with your specific data
2. **Implement multi-model approach** (different models for different platforms)
3. **Add real-time learning** from user corrections

## Monitoring and Metrics

### Key Metrics to Track
- **Feedback submission rate**: How often users provide feedback
- **Correction patterns**: What categories are commonly corrected
- **Rating distribution**: Overall AI performance scores
- **Platform-specific performance**: Which platforms need more attention

### Success Indicators
- **Reduced feedback rate**: Fewer corrections needed over time
- **Higher ratings**: Average feedback ratings increase
- **Better categorization**: More accurate category assignments
- **User satisfaction**: Positive user experience with AI

## Conclusion

The Thinkback system is well-positioned for AI training with its current prompt engineering approach. The newly added feedback system provides a foundation for continuous improvement. For the best results, start with the feedback collection and gradually implement more advanced training methods as you gather data and understand your users' needs.

The combination of prompt engineering, user feedback, and potentially RAG or fine-tuning will create a highly effective and personalized AI classification system. 