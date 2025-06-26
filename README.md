# Sensitive Data Obfuscator Extension

## Overview

The Sensitive Data Obfuscator is a lightweight Data Loss Prevention (DLP) Chrome extension designed to protect sensitive information when interacting with Large Language Models (LLMs). It automatically detects and obfuscates confidential data—such as credit card numbers, passwords, and personal identifiers—when users copy and paste content into LLM chat interfaces.

## What It Does

This extension acts as a security layer between you and AI tools, ensuring that sensitive data is protected before being sent as prompts. When you paste text containing sensitive information into LLM platforms like Claude.ai, ChatGPT, or other AI chat interfaces, the extension:

- **Automatically detects** sensitive data patterns in real-time
- **Obfuscates** the data with contextual tokens (e.g., `[CREDIT_CARD]`, `[PASSWORD]`)
- **Provides interactive management** through a floating panel interface
- **Allows selective reveals** where you can choose to use original values when needed

## Supported Data Types

The extension detects and protects:

- **Financial Data**: Credit card numbers, account numbers, transit numbers, institution numbers
- **Personal Identifiers**: Social Security Numbers (SSN), phone numbers, email addresses
- **Credentials**: Usernames, passwords, security codes
- **Custom Patterns**: Additional sensitive data patterns

## How to Use

### Basic Usage
1. **Copy sensitive data** to your clipboard
2. **Paste into the LLM chat interface** - sensitive data is automatically obfuscated
3. **Review the prompt** - sensitive information appears as tokens like `[CREDIT_CARD]`, `[USERNAME]`
4. **Manage data** via the floating shield button that appears

### Interactive Management
When sensitive data is detected, a floating shield button appears:

1. **Click the shield** to open the Sensitive Data Manager
2. **View all detected items** with their current display status
3. **Use available actions**:
   - **Edit**: Modify the original value
   - **Use Original**: Show the actual value in the prompt
   - **Restore Token**: Return to obfuscated token display
   - **Remove**: Delete the sensitive field entirely

### Advanced Features

#### Smart Contextual Detection
The extension uses intelligent pattern matching that considers context:
- Recognizes various credit card formats (4-4-4-4, 4-2-4-4-2, etc.)
- Handles different phone number formats
- Contextual username/password detection with labels

#### State Management
Each detected item has multiple states:
- **Token**: Shows obfuscated form (e.g., `[CREDIT_CARD]`)
- **Original**: Shows actual sensitive value
- **Edited**: Shows user-modified value
- **Removed**: Completely removed from prompt

#### Real-time Updates
- Changes in the manager immediately reflect in your prompt
- Dynamic button states based on current display mode
- Persistent state across manager sessions

## Privacy & Security

- **Local Processing**: All detection and obfuscation happens locally in your browser
- **No Data Transmission**: Sensitive data never leaves your machine
- **Temporary Storage**: Original values are stored only in browser memory during the session
- **Clean Prompts**: Only obfuscated or user-approved data reaches LLM services

## Supported Platforms

Currently optimized for:
- Claude.ai
- ChatGPT/OpenAI
- Google Bard/Gemini
- Bing Chat
- Perplexity.ai
- You.com

## Technical Details

- **Manifest V3** Chrome extension
- **Real-time clipboard interception** with paste event handling
- **DOM mutation observation** for dynamic content
- **Advanced regex patterns** for sensitive data detection
- **React-compatible** DOM manipulation for modern LLM interfaces

## Use Cases

- **Enterprise users** sharing data snippets with AI tools
- **Developers** seeking code review while protecting credentials
- **Researchers** analyzing datasets containing personal information
- **General users** wanting to interact safely with AI assistants

## Benefits

- **Instant Protection**: No need to manually redact sensitive information
- **Selective Sharing**: Choose exactly what data to reveal
- **Mistake Prevention**: Automatic detection prevents accidental data exposure
- **Compliance Support**: Helps maintain data protection standards
- **Productivity**: Streamlined workflow without compromising security

This extension enables confident and secure interaction with AI tools, ensuring your sensitive data remains protected while maintaining the full utility of LLM assistance.
