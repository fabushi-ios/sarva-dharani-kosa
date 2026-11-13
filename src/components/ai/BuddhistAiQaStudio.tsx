/**
 * src/components/ai/BuddhistAiQaStudio.tsx
 *
 * Dedicated Fine-Tuned Buddhist Sutra Q&A Workspace (`buddhist-nlp/mitra-qwen35-it`):
 *   - Connects conversational AI directly to ALL website data (CBETA 27 Collections + 12 International Databases + 2,482 Dhāraṇīs)
 *   - Displays retrieved canonical scripture evidences with 1-click jump into the unified Sutra/Dhāraṇī Reader
 *   - Streams tokens from the Hugging Face Space API (with automatic 20-min keep-alive & customizable Space endpoint)
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Send,
  Square,
  BookOpen,
  Database,
  Settings,
  RefreshCw,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import type { DharaniEntry } from '../../types/kosaTypes';
import type { CanonCatalogItem } from '../../core/canon/canonLibraryTypes';
import {
  retrieveWebsiteCorpusForQa,
  type RagRetrievedPassage,
} from '../../services/ai/sutraRagRetriever';
import {
  checkBuddhistQaHealth,
  loadBuddhistQaSettings,
  saveBuddhistQaSettings,
  startBuddhistQaKeepAliveBeacon,
  streamBuddhistQaChat,
  type BuddhistQaSettings,
  type QaChatMessage,
  type QaSpaceHealthStatus,
} from '../../services/ai/buddhistQaService';

interface BuddhistAiQaStudioProps {
  allEntries: DharaniEntry[];
  canonCatalog: CanonCatalogItem[];
  activeEntry: DharaniEntry | null;
  initialPrompt?: string;
  onConsumeInitialPrompt?: () => void;
  onOpenEntryInReader: (entry: DharaniEntry) => void;
  onOpenCanonScriptureInReader: (item: CanonCatalogItem) => void;
}

const STARTER_PROMPTS: Array<{ tag: string; q: string }> = [
  {
    tag: '般若原典检索 · 纯经文',
    q: '检索本库《金刚般若波罗蜜经》中“应无所住而生其心”的上下文原文，并结合梵文名相解析其核心义理。',
  },
  {
    tag: '十二大库对勘 · 房山石经',
    q: '查找本库 DB1 房山石经与大正藏中《大悲心陀罗尼》或《尊胜陀罗尼》的梵汉对音与版本特点。',
  },
  {
    tag: '梵音声明学 · 随韵与止韵',
    q: '在梵文陀罗尼（如 oṃ āḥ hūṃ）中，IAST 下加点随韵 ṃ（Anusvāra）与止韵 ḥ（Visarga）在声明学中应如何准确发音？',
  },
  {
    tag: '四语平行对勘 · 心经',
    q: '结合本库《般若波罗蜜多心经》梵本与玄奘汉译本，解析“色不异空”及心咒 gate gate pāragate pārasaṃgate bodhi svāhā 的词根语法。',
  },
  {
    tag: '净土经典直读 · 无咒原典',
    q: '检索本库《佛说阿弥陀经》关于极乐世界依正庄严与执持名号的原典经文，并说明鸠摩罗什译本的用词特色。',
  },
  {
    tag: '密续种子字 · OCHS 辞典',
    q: '本库收录的根本种子字 hrīḥ、bhrūṃ、dhīḥ 在东密悉昙相承与印度密续字轮中分别代表哪位本尊与何种法门义理？',
  },
];

export const BuddhistAiQaStudio: React.FC<BuddhistAiQaStudioProps> = ({
  allEntries,
  canonCatalog,
  activeEntry,
  initialPrompt = '',
  onConsumeInitialPrompt,
  onOpenEntryInReader,
  onOpenCanonScriptureInReader,
}) => {
  const [settings, setSettings] = useState<BuddhistQaSettings>(() => loadBuddhistQaSettings());
  const [showSettings, setShowSettings] = useState(false);
  const [customUrlDraft, setCustomUrlDraft] = useState<string>(() => loadBuddhistQaSettings().customApiBaseUrl);

  const [health, setHealth] = useState<QaSpaceHealthStatus>({
    online: false,
    checking: true,
    model: 'buddhist-nlp/mitra-qwen35-it',
    endpointUsed: '',
  });

  const [messages, setMessages] = useState<QaChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [retrievingStage, setRetrievingStage] = useState<string | null>(null);
  const [latestEvidences, setLatestEvidences] = useState<RagRetrievedPassage[]>([]);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const refreshHealth = useCallback(async (overrideUrl?: string) => {
    setHealth((prev) => ({ ...prev, checking: true }));
    const res = await checkBuddhistQaHealth(
      overrideUrl !== undefined ? overrideUrl : settings.customApiBaseUrl
    );
    setHealth(res);
  }, [settings.customApiBaseUrl]);

  useEffect(() => {
    startBuddhistQaKeepAliveBeacon(settings.customApiBaseUrl);
    void refreshHealth();
  }, [refreshHealth, settings.customApiBaseUrl]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, retrievingStage]);

  const updateSettings = (patch: Partial<BuddhistQaSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveBuddhistQaSettings(next);
      return next;
    });
  };

  const handleSendQuestion = useCallback(
    async (rawQuestion?: string) => {
      const q = (rawQuestion ?? inputText).trim();
      if (!q || isGenerating) return;

      if (!rawQuestion) {
        setInputText('');
      }

      const userMsg: QaChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: q,
        createdAt: Date.now(),
      };
      const assistantId = `a-${Date.now() + 1}`;
      const placeholderAssistant: QaChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        createdAt: Date.now(),
        model: 'buddhist-nlp/mitra-qwen35-it',
      };

      const historyForApi = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: q },
      ];

      setMessages((prev) => [...prev, userMsg, placeholderAssistant]);
      setIsGenerating(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        let retrievedPassages: RagRetrievedPassage[] = [];
        let activePayload = null;

        if (settings.enableWebsiteRag) {
          setRetrievingStage('正在联合检索 CBETA 全藏经（27部类）与全球 12 大国际梵典库原典段落...');
          const ragRes = await retrieveWebsiteCorpusForQa({
            query: q,
            allEntries,
            canonCatalog,
            activeEntry: settings.focusActiveScripture ? activeEntry : null,
            includeActiveScripture: settings.focusActiveScripture && Boolean(activeEntry),
            maxPassages: 6,
          });
          retrievedPassages = ragRes.passages;
          activePayload = ragRes.activeScripture;
          setLatestEvidences(retrievedPassages);
        } else {
          setLatestEvidences([]);
        }

        setRetrievingStage('正在调用 Hugging Face MITRA-Qwen3.5-IT 佛经微调大模型生成解答...');

        const streamResult = await streamBuddhistQaChat({
          history: historyForApi,
          passages: retrievedPassages,
          activeScripture: activePayload,
          temperature: settings.temperature,
          customApiBaseUrl: settings.customApiBaseUrl,
          signal: controller.signal,
          onMeta: (modelName) => {
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, model: modelName } : m))
            );
          },
          onToken: (_delta, fullSoFar) => {
            setRetrievingStage(null);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      content: fullSoFar,
                      citations: retrievedPassages,
                    }
                  : m
              )
            );
          },
        });

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: streamResult.content,
                  model: streamResult.model,
                  citations: retrievedPassages,
                  isOfflineFallback: streamResult.isOfflineFallback,
                }
              : m
          )
        );
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: m.content ? `${m.content}\n\n[已停止生成]` : '[已取消生成]' }
                : m
            )
          );
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: `请求异常：${err instanceof Error ? err.message : String(err)}` }
                : m
            )
          );
        }
      } finally {
        setRetrievingStage(null);
        setIsGenerating(false);
        abortRef.current = null;
      }
    },
    [
      activeEntry,
      allEntries,
      canonCatalog,
      inputText,
      isGenerating,
      messages,
      settings.customApiBaseUrl,
      settings.enableWebsiteRag,
      settings.focusActiveScripture,
      settings.temperature,
    ]
  );

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim() && !isGenerating) {
      const promptToRun = initialPrompt.trim();
      onConsumeInitialPrompt?.();
      void handleSendQuestion(promptToRun);
    }
  }, [initialPrompt, isGenerating, handleSendQuestion, onConsumeInitialPrompt]);

  const handleOpenCitation = (c: RagRetrievedPassage) => {
    if (c.canonItem) {
      onOpenCanonScriptureInReader(c.canonItem);
      return;
    }
    if (c.entry) {
      onOpenEntryInReader(c.entry);
      return;
    }
    if (c.canonId) {
      const foundCanon = canonCatalog.find((item) => item.id === c.canonId);
      if (foundCanon) {
        onOpenCanonScriptureInReader(foundCanon);
        return;
      }
    }
    if (c.entryId) {
      const foundEntry = allEntries.find((e) => e.id === c.entryId);
      if (foundEntry) {
        onOpenEntryInReader(foundEntry);
      }
    }
  };

  const handleCopyMessage = (msg: QaChatMessage) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    void navigator.clipboard.writeText(msg.content).then(() => {
      setCopiedMsgId(msg.id);
      setTimeout(() => setCopiedMsgId(null), 1800);
    });
  };

  return (
    <div className="buddhist-qa-shell" aria-label="佛经微调大模型问答与全藏检索工作台">
      {/* Left Sidebar: Authoritative Model Info, RAG Scope Controls & Live Retrieved Evidences */}
      <aside className="buddhist-qa-sidebar">
        <div className="buddhist-qa-side-card">
          <div className="buddhist-qa-side-title">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldCheck size={15} color="var(--accent-vermilion)" />
              <span>权威微调佛经底座模型</span>
            </span>
            <span className={`buddhist-qa-model-pill ${health.online ? '' : 'is-offline'}`}>
              {health.checking
                ? '检测中...'
                : health.online
                ? `● HF 在线 (${health.latencyMs ?? 0}ms)`
                : '○ 待唤醒/本地检索'}
            </span>
          </div>

          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-vermilion)' }}>
            buddhist-nlp/mitra-qwen35-it (9B)
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.48 }}>
            加州大学伯克利分校 Dharmamitra 佛学 NLP 团队在 <strong>CBETA 汉文大藏经</strong>、
            <strong>GRETIL 梵本</strong>、<strong>84000/甘珠尔藏文</strong>与<strong>巴利三藏</strong>（220亿词元）上持续预训练并微调的旗舰对话与经论对勘大模型，通过 Hugging Face Space 自动保活提供流式 API。
          </div>
        </div>

        <div className="buddhist-qa-side-card">
          <div className="buddhist-qa-side-title">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Database size={14} color="var(--accent-lapis)" />
              <span>打通本网站全库数据 (RAG)</span>
            </span>
          </div>

          <label className="buddhist-qa-toggle-row">
            <span>检索全站 12 大梵典库 + CBETA 全藏经</span>
            <input
              type="checkbox"
              checked={settings.enableWebsiteRag}
              onChange={(e) => updateSettings({ enableWebsiteRag: e.target.checked })}
            />
          </label>

          {activeEntry && (
            <label className="buddhist-qa-toggle-row">
              <span style={{ minWidth: 0 }}>
                同时关联当前阅读经典：<strong>{activeEntry.titleZh}</strong>
              </span>
              <input
                type="checkbox"
                checked={settings.focusActiveScripture}
                onChange={(e) => updateSettings({ focusActiveScripture: e.target.checked })}
              />
            </label>
          )}

          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            当前已连通本库 <strong>{allEntries.length.toLocaleString()}</strong> 部精校真言/12库梵本与{' '}
            <strong>{canonCatalog.length > 0 ? canonCatalog.length.toLocaleString() : '全量'}</strong>{' '}
            部 CBETA 藏经原卷全文。
          </div>
        </div>

        <div className="buddhist-qa-side-card">
          <div className="buddhist-qa-side-title">
            <span>本次对话命中的网站原典 ({latestEvidences.length})</span>
          </div>

          {latestEvidences.length === 0 ? (
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              提问后，AI 会自动从本网站的 CBETA 经卷与 12 大数据库中检索原文段落并在此列出，支持一键跳转原卷精读。
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {latestEvidences.map((ev) => (
                <div key={ev.id} className="buddhist-qa-citation-card">
                  <div className="buddhist-qa-citation-top">
                    <strong style={{ color: 'var(--text-primary)' }}>{ev.title}</strong>
                    <span className="buddhist-qa-citation-badge">{ev.badge}</span>
                  </div>
                  <div className="buddhist-qa-citation-snippet">{ev.snippet}</div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn-scholarly primary"
                      style={{ padding: '0.18rem 0.52rem', fontSize: '0.7rem' }}
                      onClick={() => handleOpenCitation(ev)}
                    >
                      <BookOpen size={12} />
                      <span>在阅读器打开原文</span>
                    </button>
                    {ev.url && (
                      <a
                        href={ev.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-scholarly"
                        style={{ padding: '0.18rem 0.52rem', fontSize: '0.7rem' }}
                      >
                        <ExternalLink size={11} />
                        <span>源库</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Main Conversational Studio */}
      <section className="buddhist-qa-main">
        <div className="buddhist-qa-header">
          <div>
            <div className="buddhist-qa-header-title">
              <Sparkles size={18} color="var(--accent-vermilion)" />
              <span>佛经大模型 AI 问答 · MITRA-Qwen3.5 全藏经论与梵音对勘</span>
            </div>
            <div className="buddhist-qa-header-sub">
              基于微调佛学大模型与本站 12 大国际梵典库 + CBETA 全藏经原文实时检索增强（RAG），每条引文均可一键核验原典
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-scholarly"
              onClick={() => void refreshHealth()}
              title="立即触发 Hugging Face Space 健康检查与唤醒保活探针"
            >
              <RefreshCw size={13} className={health.checking ? 'spin-icon' : ''} />
              <span>保活唤醒检测</span>
            </button>

            <button
              type="button"
              className={`btn-scholarly ${showSettings ? 'gold' : ''}`}
              onClick={() => setShowSettings((s) => !s)}
            >
              <Settings size={13} />
              <span>HF API 配置</span>
            </button>

            {messages.length > 0 && (
              <button
                type="button"
                className="btn-scholarly"
                onClick={() => {
                  abortRef.current?.abort();
                  setMessages([]);
                  setLatestEvidences([]);
                }}
              >
                <Trash2 size={13} />
                <span>清空对话</span>
              </button>
            )}
          </div>
        </div>

        {showSettings && (
          <div className="buddhist-qa-settings-box">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <strong>Hugging Face Space 推理 API 端点与参数配置</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.73rem' }}>
                留空则默认走同源边缘代理 <code>/qa-api</code> 与预设 Hugging Face Space（支持直接填 <code>用户名/Space名</code>）
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                className="buddhist-qa-settings-input"
                placeholder="例如：bhrum108/sarva-dharani-kosa-buddhist-qa 或自定义 Space URL（留空使用默认）"
                value={customUrlDraft}
                onChange={(e) => setCustomUrlDraft(e.target.value)}
              />
              <button
                type="button"
                className="btn-scholarly primary"
                onClick={() => {
                  updateSettings({ customApiBaseUrl: customUrlDraft.trim() });
                  void refreshHealth(customUrlDraft.trim());
                }}
              >
                <span>保存并连接测试</span>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>采样严谨度 (Temperature = {settings.temperature.toFixed(2)})：</span>
                <input
                  type="range"
                  min={0.1}
                  max={0.8}
                  step={0.05}
                  value={settings.temperature}
                  onChange={(e) => updateSettings({ temperature: Number(e.target.value) })}
                />
              </label>
              {health.errorHint && !health.online && (
                <span style={{ color: 'var(--accent-gold)', fontSize: '0.73rem' }}>
                  当前状态：{health.errorHint}（执行 <code>npm run deploy:qa-hf</code> 即可一键部署至 Hugging Face）
                </span>
              )}
            </div>
          </div>
        )}

        <div className="buddhist-qa-messages">
          {messages.length === 0 ? (
            <div className="buddhist-qa-empty">
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-zh-serif)' }}>
                  向 MITRA-Qwen3.5 佛经大模型提问 · 实时检索全站藏经与梵典
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  支持经论义理考辨、原典名句出处查找、梵文陀罗尼词根语法解析、悉昙声韵（Śikṣā）与跨库平行本对勘
                </div>
              </div>

              <div className="buddhist-qa-prompt-grid">
                {STARTER_PROMPTS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="buddhist-qa-prompt-card"
                    onClick={() => void handleSendQuestion(item.q)}
                  >
                    <span className="buddhist-qa-prompt-tag">{item.tag}</span>
                    <span className="buddhist-qa-prompt-text">{item.q}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`buddhist-qa-msg ${msg.role === 'user' ? 'is-user' : 'is-assistant'}`}
              >
                {msg.role === 'assistant' && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <span>
                      ☸️ <strong>{msg.model || 'buddhist-nlp/mitra-qwen35-it'}</strong>
                      {msg.citations && msg.citations.length > 0
                        ? ` · 已结合 ${msg.citations.length} 部本库经文证据`
                        : ''}
                    </span>
                    {msg.content && (
                      <button
                        type="button"
                        className="btn-scholarly"
                        style={{ padding: '0.12rem 0.45rem', fontSize: '0.68rem' }}
                        onClick={() => handleCopyMessage(msg)}
                      >
                        {copiedMsgId === msg.id ? <Check size={11} /> : <Copy size={11} />}
                        <span>{copiedMsgId === msg.id ? '已复制' : '复制回答'}</span>
                      </button>
                    )}
                  </div>
                )}

                <div className="buddhist-qa-bubble">
                  {msg.content ||
                    (retrievingStage ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-secondary)' }}>
                        <Loader2 size={15} className="spin-icon" color="var(--accent-vermilion)" />
                        <span>{retrievingStage}</span>
                      </span>
                    ) : (
                      '...'
                    ))}
                </div>

                {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                  <div className="buddhist-qa-citations">
                    {msg.citations.slice(0, 4).map((cit) => (
                      <div key={cit.id} className="buddhist-qa-citation-card">
                        <div className="buddhist-qa-citation-top">
                          <strong style={{ color: 'var(--text-primary)' }}>{cit.title}</strong>
                          <span className="buddhist-qa-citation-badge">{cit.badge}</span>
                        </div>
                        <div className="buddhist-qa-citation-snippet">{cit.snippet}</div>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="btn-scholarly primary"
                            style={{ padding: '0.18rem 0.52rem', fontSize: '0.7rem' }}
                            onClick={() => handleOpenCitation(cit)}
                          >
                            <BookOpen size={12} />
                            <span>在阅读器中打开</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form
          className="buddhist-qa-composer"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSendQuestion();
          }}
        >
          <div className="buddhist-qa-input-row">
            <textarea
              id="buddhist-ai-chat-input"
              className="buddhist-qa-textarea"
              placeholder={
                activeEntry && settings.focusActiveScripture
                  ? `就当前阅读的 ${activeEntry.titleZh} 或全站任意佛经、梵文陀罗尼提问（按 Enter 发送，Shift+Enter 换行）...`
                  : '输入佛经名句、义理问题、梵文陀罗尼或经号进行检索对话（按 Enter 发送，Shift+Enter 换行）...'
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  void handleSendQuestion();
                }
              }}
            />

            {isGenerating ? (
              <button
                type="button"
                className="btn-scholarly primary"
                style={{ height: '42px', padding: '0 1rem' }}
                onClick={() => abortRef.current?.abort()}
              >
                <Square size={14} />
                <span>停止</span>
              </button>
            ) : (
              <button
                type="submit"
                className="btn-scholarly primary"
                style={{ height: '42px', padding: '0 1.1rem' }}
                disabled={!inputText.trim()}
              >
                <Send size={14} />
                <span>发送提问</span>
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
};

export default BuddhistAiQaStudio;
