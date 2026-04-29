import './App.css'
import './reset.css'
import styled from "styled-components";
import {ChatMessage, IChatMessage} from "./ChatMessage";
import {FormEvent, useEffect, useState} from "react";

const AppShell = styled.main`
    display: grid;
    grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
    height: 100%;
    font-family: Roboto, sans-serif;
    color: #172018;

    @media (max-width: 720px) {
        grid-template-columns: 1fr;
    }
`

const Sidebar = styled.aside`
    display: flex;
    flex-direction: column;
    border-inline-end: 1px solid #d7ded8;
    background: #f5f7f5;
    min-height: 0;
`

const SidebarHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 12px;
    border-bottom: 1px solid #d7ded8;
`

const Header = styled.h1`
    font-size: 18px;
    font-weight: 700;
`

const ConversationList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px;
    overflow-y: auto;
`

const ConversationButton = styled.button<{ $isActive: boolean }>`
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
    border: 1px solid ${({$isActive}) => $isActive ? '#3f6f47' : 'transparent'};
    background: ${({$isActive}) => $isActive ? '#e6efe8' : 'transparent'};
    border-radius: 6px;
    padding: 8px;
    text-align: start;
    cursor: pointer;

    &:hover {
        background: #eaf0eb;
    }
`

const ConversationTitle = styled.span`
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`

const ConversationPreview = styled.span`
    color: #5b665d;
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`

const ChatPanel = styled.section`
    display: flex;
    flex-direction: column;
    min-height: 0;
`

const ChatHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 54px;
    padding: 12px;
    border-bottom: 1px solid #d7ded8;
`

const ChatTitle = styled.h2`
    font-size: 18px;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`

const ChatMessagesWrapper = styled.section`
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
    overflow-y: auto;
    flex: 1;
`;

const Form = styled.form`
    display: flex;
    gap: 8px;
    padding: 12px;
    border-top: 1px solid #d7ded8;
`

const MessageInput = styled.input`
    flex: 1;
    min-width: 0;
    border: 1px solid #bac5bc;
    border-radius: 6px;
    padding: 8px 10px;
`

const Button = styled.button`
    border: 1px solid #3f6f47;
    background: #3f6f47;
    color: white;
    border-radius: 6px;
    padding: 8px 12px;
    cursor: pointer;

    &:disabled {
        cursor: not-allowed;
        opacity: 0.6;
    }
`

const SecondaryButton = styled(Button)`
    background: white;
    color: #2f5535;
`

const EmptyState = styled.p`
    margin: auto;
    color: #5b665d;
`

const ErrorMessage = styled.p`
    color: #b00020;
    margin: 8px 12px;
`

type ConversationSummary = {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    messageCount: number;
    lastMessagePreview: string;
};

type Conversation = {
    id: string;
    title: string;
    messages: IChatMessage[];
    createdAt: string;
    updatedAt: string;
};

type ConversationsResponse = {
    conversations: ConversationSummary[];
};

type ConversationResponse = {
    conversation: Conversation;
};

type SendMessageResponse = {
    conversation: Conversation;
    message: IChatMessage;
};

type ChatFormElements = HTMLFormControlsCollection & {
    message: HTMLInputElement;
};

type ChatForm = HTMLFormElement & {
    elements: ChatFormElements;
};

const apiBaseUrl = 'http://localhost:3000';
const selectedConversationStorageKey = 'selectedConversationId';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error('Request failed.');
    }

    return await response.json() as T;
}

function toSummary(conversation: Conversation): ConversationSummary {
    const lastMessage = conversation.messages[conversation.messages.length - 1];

    return {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messageCount: conversation.messages.length,
        lastMessagePreview: lastMessage?.content ?? '',
    };
}

function App() {
    const [conversations, setConversations] = useState<ConversationSummary[]>([])
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const [error, setError] = useState<string | null>(null)

    function upsertConversationSummary(conversation: Conversation) {
        const summary = toSummary(conversation);
        setConversations((currentConversations) => [
            summary,
            ...currentConversations.filter((currentConversation) => currentConversation.id !== summary.id),
        ]);
    }

    async function loadConversation(conversationId: string) {
        const data = await fetchJson<ConversationResponse>(`${apiBaseUrl}/conversations/${conversationId}`);
        setSelectedConversation(data.conversation);
        localStorage.setItem(selectedConversationStorageKey, data.conversation.id);
        upsertConversationSummary(data.conversation);
    }

    useEffect(() => {
        let isMounted = true;

        async function loadInitialState() {
            setIsLoading(true);
            setError(null);

            try {
                const data = await fetchJson<ConversationsResponse>(`${apiBaseUrl}/conversations`);

                if (!isMounted) {
                    return;
                }

                setConversations(data.conversations);

                const storedConversationId = localStorage.getItem(selectedConversationStorageKey);
                const canRestoreConversation = data.conversations.some(
                    (conversation) => conversation.id === storedConversationId
                );

                if (storedConversationId && canRestoreConversation) {
                    await loadConversation(storedConversationId);
                    return;
                }

                localStorage.removeItem(selectedConversationStorageKey);
            } catch (caughtError) {
                if (isMounted) {
                    setError(caughtError instanceof Error ? caughtError.message : 'Something went wrong.');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        void loadInitialState();

        return () => {
            isMounted = false;
        };
    }, [])

    async function createNewConversation() {
        if (isCreating) {
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            const data = await fetchJson<ConversationResponse>(`${apiBaseUrl}/conversations`, {
                method: 'POST',
            });

            setSelectedConversation(data.conversation);
            localStorage.setItem(selectedConversationStorageKey, data.conversation.id);
            upsertConversationSummary(data.conversation);
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : 'Something went wrong.');
        } finally {
            setIsCreating(false);
        }
    }

    async function selectConversation(conversationId: string) {
        setError(null);

        try {
            await loadConversation(conversationId);
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : 'Something went wrong.');
        }
    }

    const formOnSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!selectedConversation) {
            return;
        }

        const form = e.currentTarget as ChatForm;
        const input = form.elements.message;
        const content = input.value.trim();

        if (!content || isSending) {
            return;
        }

        setIsSending(true);
        setError(null);
        input.value = '';

        try {
            const data = await fetchJson<SendMessageResponse>(
                `${apiBaseUrl}/conversations/${selectedConversation.id}/messages`,
                {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({content}),
                }
            );

            setSelectedConversation(data.conversation);
            upsertConversationSummary(data.conversation);
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : 'Something went wrong.');
        } finally {
            setIsSending(false);
        }
    }

    const selectedConversationId = selectedConversation?.id;

    return (
        <AppShell>
            <Sidebar>
                <SidebarHeader>
                    <Header>Conversations</Header>
                    <Button type="button" onClick={createNewConversation} disabled={isCreating}>
                        {isCreating ? 'Creating...' : 'New'}
                    </Button>
                </SidebarHeader>
                <ConversationList>
                    {isLoading && <EmptyState>Loading...</EmptyState>}
                    {!isLoading && conversations.length === 0 && <EmptyState>No conversations yet.</EmptyState>}
                    {conversations.map((conversation) => (
                        <ConversationButton
                            key={conversation.id}
                            type="button"
                            $isActive={conversation.id === selectedConversationId}
                            onClick={() => void selectConversation(conversation.id)}
                        >
                            <ConversationTitle>{conversation.title}</ConversationTitle>
                            <ConversationPreview>
                                {conversation.lastMessagePreview || `${conversation.messageCount} messages`}
                            </ConversationPreview>
                        </ConversationButton>
                    ))}
                </ConversationList>
            </Sidebar>
            <ChatPanel>
                <ChatHeader>
                    <ChatTitle>{selectedConversation?.title ?? 'Welcome to Notch!'}</ChatTitle>
                    {selectedConversation && (
                        <SecondaryButton
                            type="button"
                            onClick={() => {
                                setSelectedConversation(null);
                                localStorage.removeItem(selectedConversationStorageKey);
                            }}
                        >
                            Back
                        </SecondaryButton>
                    )}
                </ChatHeader>
                {selectedConversation ? (
                    <>
                        <ChatMessagesWrapper>
                            {selectedConversation.messages.length === 0 && <EmptyState>No messages yet.</EmptyState>}
                            {selectedConversation.messages.map((chatMessage) => (
                                <ChatMessage {...chatMessage} key={chatMessage.id}/>
                            ))}
                        </ChatMessagesWrapper>
                        <Form onSubmit={formOnSubmit}>
                            <MessageInput type="text" name="message" disabled={isSending}/>
                            <Button type="submit" disabled={isSending}>
                                {isSending ? 'Sending...' : 'Send'}
                            </Button>
                        </Form>
                    </>
                ) : (
                    <EmptyState>Select or create a conversation.</EmptyState>
                )}
                {error && <ErrorMessage>{error}</ErrorMessage>}
            </ChatPanel>
        </AppShell>
    )
}

export default App
