/**
 * IntelChatPanel — Intelligence Chat panel with briefing support.
 *
 * Extends Panel base class with vanilla DOM (h() helper, NOT JSX).
 * Provides a scrollable chat interface with user/assistant messages,
 * tool usage badges, a text input with Enter-to-send, and a
 * Generate Briefing button for structured intelligence summaries.
 *
 * Content rendered as textContent for user messages, DOMPurify.sanitize()
 * for assistant messages, for XSS safety.
 */

import { Panel } from './Panel';
import { t } from '@/services/i18n';
import { h, replaceChildren } from '@/utils/dom-utils';
import { createErrorDisplay } from './sentinel/error-display';
import { createDataFreshnessIndicator, type FreshnessStatus } from './sentinel/DataFreshnessIndicator';
import { sendChatMessage, generateBriefing, type ChatMessage } from '@/services/intel';
import DOMPurify from 'dompurify';

const MAX_MESSAGES = 50;

interface DisplayMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolsUsed?: string[];
}

export class IntelChatPanel extends Panel {
  private messagesArea: HTMLElement;
  private inputEl: HTMLTextAreaElement;
  private sendBtn: HTMLButtonElement;
  private briefingBtn: HTMLButtonElement;
  private freshnessEl: HTMLElement | null = null;
  private messages: DisplayMessage[] = [];
  private chatHistory: ChatMessage[] = [];
  private isLoading = false;

  constructor() {
    super({
      id: 'intel-chat',
      title: t('sentinel.intel.title'),
      className: 'panel-wide',
    });

    this.messagesArea = h('div', { className: 'intel-chat-messages' });

    this.inputEl = h('textarea', {
      className: 'intel-chat-input',
      placeholder: t('sentinel.intel.placeholder'),
      rows: 2,
    }) as HTMLTextAreaElement;

    this.inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });

    this.sendBtn = h('button', {
      className: 'intel-chat-send',
      type: 'button',
    }, t('sentinel.intel.send')) as HTMLButtonElement;
    this.sendBtn.addEventListener('click', () => this.handleSend());

    this.briefingBtn = h('button', {
      className: 'intel-chat-briefing',
      type: 'button',
    }, t('sentinel.intel.briefing')) as HTMLButtonElement;
    this.briefingBtn.addEventListener('click', () => this.handleBriefing());

    const inputRow = h('div', { className: 'intel-chat-input-row' },
      this.inputEl,
      this.sendBtn,
      this.briefingBtn,
    );

    const container = h('div', { className: 'intel-chat-container' },
      this.messagesArea,
      inputRow,
    );

    replaceChildren(this.content, container);
    this.injectStyles();

    // Welcome message
    this.addMessage({
      role: 'system',
      content: t('sentinel.intel.welcome'),
    });
  }

  private injectStyles(): void {
    if (document.getElementById('intel-chat-styles')) return;

    const style = document.createElement('style');
    style.id = 'intel-chat-styles';
    style.textContent = `
      .intel-chat-container { display: flex; flex-direction: column; height: 100%; }
      .intel-chat-messages { flex: 1; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 8px; }
      .intel-chat-msg { padding: 8px 12px; border-radius: 8px; max-width: 85%; word-wrap: break-word; white-space: pre-wrap; font-size: 0.9em; line-height: 1.5; }
      .intel-chat-msg--user { align-self: flex-end; background: var(--accent-color, #3b82f6); color: white; }
      .intel-chat-msg--assistant { align-self: flex-start; background: var(--bg-secondary, #2a2a2a); color: var(--text-primary, #fff); }
      .intel-chat-msg--system { align-self: center; font-style: italic; color: var(--text-secondary, #aaa); font-size: 0.85em; text-align: center; }
      .intel-chat-msg--loading { align-self: center; color: var(--text-secondary, #aaa); font-style: italic; animation: intel-chat-pulse 1.5s ease-in-out infinite; }
      @keyframes intel-chat-pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
      .intel-chat-tools { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
      .intel-chat-tool-badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 0.7em; background: var(--accent-color, #3b82f6)20; color: var(--accent-color, #3b82f6); border: 1px solid var(--accent-color, #3b82f6)40; }
      .intel-chat-input-row { display: flex; gap: 8px; padding: 8px; border-top: 1px solid var(--border-color, #444); }
      .intel-chat-input { flex: 1; padding: 8px; background: var(--bg-secondary, #2a2a2a); border: 1px solid var(--border-color, #444); color: var(--text-primary, #fff); border-radius: 4px; font-family: inherit; resize: none; font-size: 0.9em; }
      .intel-chat-send, .intel-chat-briefing { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; white-space: nowrap; font-size: 0.85em; }
      .intel-chat-send { background: var(--accent-color, #3b82f6); color: white; }
      .intel-chat-send:hover { background: var(--accent-hover, #2563eb); }
      .intel-chat-send:disabled { opacity: 0.5; cursor: not-allowed; }
      .intel-chat-briefing { background: transparent; color: var(--accent-color, #3b82f6); border: 1px solid var(--accent-color, #3b82f6); }
      .intel-chat-briefing:hover { background: var(--accent-color, #3b82f6)10; }
      .intel-chat-briefing:disabled { opacity: 0.5; cursor: not-allowed; }
      .intel-chat-disclaimer { font-size: 0.75em; color: var(--text-secondary, #888); margin-top: 4px; font-style: italic; }
    `;
    document.head.appendChild(style);
  }

  private async handleSend(): Promise<void> {
    const text = this.inputEl.value.trim();
    if (!text || this.isLoading) return;

    this.inputEl.value = '';

    // Add user message to display
    this.addMessage({ role: 'user', content: text });

    // Add to chat history for API
    this.chatHistory.push({ role: 'user', content: text });

    this.setLoading(true);
    this.updateFreshness('loading');

    try {
      const resp = await sendChatMessage(this.chatHistory);
      if (!this.element?.isConnected) return;

      if (resp.status === 'error') {
        this.addMessage({
          role: 'assistant',
          content: resp.errorMessage || t('sentinel.intel.error'),
        });
        this.updateFreshness('unavailable');
        return;
      }

      // Add assistant reply to chat history
      this.chatHistory.push({ role: 'assistant', content: resp.reply });

      this.addMessage({
        role: 'assistant',
        content: resp.reply,
        toolsUsed: resp.toolsUsed,
      });

      this.updateFreshness('live');
    } catch (err) {
      if (!this.element?.isConnected) return;
      console.error('[IntelChatPanel] Error:', err);
      this.addMessage({
        role: 'assistant',
        content: err instanceof Error ? err.message : t('sentinel.intel.error'),
      });
      this.updateFreshness('unavailable');
    } finally {
      this.setLoading(false);
    }
  }

  private async handleBriefing(): Promise<void> {
    if (this.isLoading) return;

    this.setLoading(true);
    this.updateFreshness('loading');

    this.addMessage({
      role: 'system',
      content: t('sentinel.intel.briefingGenerating'),
    });

    try {
      const resp = await generateBriefing();
      if (!this.element?.isConnected) return;

      if (resp.status === 'error') {
        this.addMessage({
          role: 'assistant',
          content: resp.errorMessage || t('sentinel.intel.error'),
        });
        this.updateFreshness('unavailable');
        return;
      }

      if (!resp.sections || resp.sections.length === 0) {
        this.addMessage({
          role: 'assistant',
          content: t('sentinel.intel.briefingEmpty'),
        });
        this.updateFreshness('unavailable');
        return;
      }

      // Format sections as readable text
      const lines: string[] = [`--- ${t('sentinel.intel.briefingTitle')} ---`, ''];
      for (const section of resp.sections) {
        lines.push(`## ${section.title}`);
        lines.push(section.content);
        if (section.sources && section.sources.length > 0) {
          lines.push(`[${section.sources.join(', ')}]`);
        }
        lines.push('');
      }
      if (resp.disclaimer) {
        lines.push(resp.disclaimer);
      }

      this.addMessage({
        role: 'assistant',
        content: lines.join('\n'),
      });

      const generatedStr = resp.generatedAt
        ? new Date(resp.generatedAt).toISOString()
        : null;
      this.updateFreshness('live', generatedStr);
    } catch (err) {
      if (!this.element?.isConnected) return;
      console.error('[IntelChatPanel] Briefing error:', err);
      this.addMessage({
        role: 'assistant',
        content: err instanceof Error ? err.message : t('sentinel.intel.error'),
      });
      this.updateFreshness('unavailable');
    } finally {
      this.setLoading(false);
    }
  }

  private addMessage(msg: DisplayMessage): void {
    this.messages.push(msg);

    // Enforce max messages
    while (this.messages.length > MAX_MESSAGES) {
      this.messages.shift();
    }

    const msgEl = this.renderMessage(msg);
    this.messagesArea.appendChild(msgEl);

    // Trim DOM to match max messages
    while (this.messagesArea.children.length > MAX_MESSAGES) {
      this.messagesArea.removeChild(this.messagesArea.firstChild!);
    }

    // Scroll to bottom
    this.messagesArea.scrollTop = this.messagesArea.scrollHeight;
  }

  private renderMessage(msg: DisplayMessage): HTMLElement {
    const bubble = h('div', {
      className: `intel-chat-msg intel-chat-msg--${msg.role}`,
    });

    if (msg.role === 'user') {
      // User messages: textContent only for XSS safety
      bubble.textContent = msg.content;
    } else {
      // Assistant/system messages: sanitize through DOMPurify
      const sanitized = DOMPurify.sanitize(msg.content, { ALLOWED_TAGS: [] });
      bubble.textContent = sanitized;
    }

    // Tool badges for assistant messages
    if (msg.role === 'assistant' && msg.toolsUsed && msg.toolsUsed.length > 0) {
      const toolsContainer = h('div', { className: 'intel-chat-tools' },
        ...msg.toolsUsed.map(tool =>
          h('span', { className: 'intel-chat-tool-badge' }, tool),
        ),
      );
      bubble.appendChild(toolsContainer);
    }

    return bubble;
  }

  private setLoading(loading: boolean): void {
    this.isLoading = loading;
    this.sendBtn.disabled = loading;
    this.briefingBtn.disabled = loading;
    this.inputEl.disabled = loading;

    // Remove any existing loading indicator
    const existing = this.messagesArea.querySelector('.intel-chat-msg--loading');
    if (existing) existing.remove();

    if (loading) {
      const loadingEl = h('div', {
        className: 'intel-chat-msg intel-chat-msg--loading',
      }, t('sentinel.intel.generating'));
      this.messagesArea.appendChild(loadingEl);
      this.messagesArea.scrollTop = this.messagesArea.scrollHeight;
    }
  }

  private updateFreshness(status: FreshnessStatus, lastUpdated?: string | null): void {
    if (this.freshnessEl) {
      this.freshnessEl.remove();
    }
    this.freshnessEl = createDataFreshnessIndicator(status, lastUpdated);
    this.element.insertBefore(this.freshnessEl, this.header.nextSibling);
  }

  public showError(message = t('sentinel.intel.error')): void {
    try {
      createErrorDisplay('IntelChat', this.content, new Error(message));
    } catch {
      super.showError(message);
    }
  }

  public destroy(): void {
    if (this.freshnessEl) {
      this.freshnessEl.remove();
      this.freshnessEl = null;
    }
    this.messages = [];
    this.chatHistory = [];
    super.destroy();
  }
}
