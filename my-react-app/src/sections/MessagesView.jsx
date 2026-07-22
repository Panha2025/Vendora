import { useEffect, useMemo, useRef, useState } from 'react'

function MessagesView({
  activeConversationId,
  conversations,
  onOpenConversation,
  onSendMessage,
  onShowListing,
}) {
  const threadRef = useRef(null)
  const [conversationSearch, setConversationSearch] = useState('')
  const [draft, setDraft] = useState('')

  const filteredConversations = useMemo(() => {
    const normalizedSearch = conversationSearch.trim().toLowerCase()

    if (!normalizedSearch) {
      return conversations
    }

    return conversations.filter((conversation) =>
      `${conversation.seller} ${conversation.product.title} ${conversation.lastMessage}`
        .toLowerCase()
        .includes(normalizedSearch),
    )
  }, [conversationSearch, conversations])

  const activeConversation =
    conversations.find((conversation) => conversation.id === activeConversationId)
    || conversations[0]

  useEffect(() => {
    const thread = threadRef.current

    if (thread) {
      thread.scrollTop = thread.scrollHeight
    }
  }, [activeConversation?.id, activeConversation?.messages.length])

  function handleSubmit(event) {
    event.preventDefault()

    if (!activeConversation || !draft.trim()) {
      return
    }

    onSendMessage(activeConversation.id, draft.trim())
    setDraft('')
  }

  return (
    <section className="messages-view" aria-label="Messages">
      <aside className="messages-list-panel">
        <div className="messages-panel-heading">
          <h2>Messages</h2>
          <span className="live-chat-pill">Live</span>
        </div>

        <label className="conversation-search">
          <span>Search conversations</span>
          <input
            placeholder="Search conversations..."
            type="search"
            value={conversationSearch}
            onChange={(event) => setConversationSearch(event.target.value)}
          />
        </label>

        <div className="conversation-list">
          {filteredConversations.map((conversation) => (
            <button
              className={
                conversation.id === activeConversation?.id ? 'active' : ''
              }
              key={conversation.id}
              type="button"
              onClick={() => onOpenConversation(conversation.id)}
            >
              <img src={conversation.product.image} alt="" decoding="async" loading="lazy" />
              <span>
                <strong>{conversation.seller}</strong>
                <small>{conversation.lastMessage}</small>
              </span>
              <em>{conversation.time}</em>
              {conversation.unread > 0 && <b>{conversation.unread}</b>}
            </button>
          ))}
        </div>

        <div className="messages-safety">
          <strong>Stay safe!</strong>
          <span>Never share personal info. Meet in safe public places.</span>
          <button type="button">Learn more</button>
        </div>
      </aside>

      {activeConversation ? (
        <article className="chat-panel">
          <header className="chat-header">
            <div className="chat-listing-summary">
              <img src={activeConversation.product.image} alt="" decoding="async" loading="eager" />
              <div>
                <strong>{activeConversation.seller}</strong>
                <span>{activeConversation.product.title}</span>
                <b>${activeConversation.product.price}</b>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onShowListing(activeConversation.product)}
            >
              View Listing
            </button>
          </header>

          <div className="chat-date">May 24, 2024</div>

          <div className="message-thread" ref={threadRef}>
            {activeConversation.messages.map((message) => (
              <div
                className={`message-bubble-row ${
                  message.sender === 'me' ? 'from-me' : 'from-seller'
                }`}
                key={message.id}
              >
                {message.sender !== 'me' && (
                  <img
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80"
                    alt=""
                    decoding="async"
                    loading="lazy"
                  />
                )}
                <p>
                  <span>{message.text}</span>
                  <small>{message.time}</small>
                </p>
              </div>
            ))}
          </div>

          <form className="message-composer" onSubmit={handleSubmit}>
            <button type="button" aria-label="Attach file">
              +
            </button>
            <input
              placeholder="Type a message..."
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <button type="submit">Send</button>
          </form>
        </article>
      ) : (
        <article className="chat-panel empty-chat">
          <h2>No conversations yet</h2>
          <p>Click Message on a listing to start chatting with a seller.</p>
        </article>
      )}
    </section>
  )
}

export default MessagesView
