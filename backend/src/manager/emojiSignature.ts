import {ChatMessage} from '../schema/chat.schema';

const emojiRegex = /(?:\p{Emoji_Presentation}|\p{Extended_Pictographic}|\p{Regional_Indicator})/u;
const graphemeSegmenter = new Intl.Segmenter(undefined, {granularity: 'grapheme'});
const replacementEmojiRanges = [
  [0x1F600, 0x1F64F],
  [0x1F680, 0x1F6FF],
  [0x1F300, 0x1F5FF],
  [0x1F900, 0x1F9FF],
] as const;

function getLastGrapheme(value: string): string | undefined {
  return Array.from(graphemeSegmenter.segment(value.trim()), ({segment}) => segment).at(-1);
}

export function getUsedSignatureEmojis(messages: ChatMessage[]): Set<string> {
  return new Set(
    messages
      .filter((message) => message.role === 'agent')
      .map((message) => getLastGrapheme(message.content))
      .filter((emoji): emoji is string => emoji !== undefined && emojiRegex.test(emoji))
  );
}

function getFreshSignatureEmoji(usedEmojis: Set<string>): string | undefined {
  for (const [rangeStart, rangeEnd] of replacementEmojiRanges) {
    for (let codePoint = rangeStart; codePoint <= rangeEnd; codePoint += 1) {
      const emoji = String.fromCodePoint(codePoint);

      if (emojiRegex.test(emoji) && !usedEmojis.has(emoji)) {
        return emoji;
      }
    }
  }

  return undefined;
}

export function ensureFreshEmojiSignature(content: string, usedEmojis: Set<string>): string {
  const trimmedContent = content.trim();
  const lastGrapheme = getLastGrapheme(trimmedContent);

  if (lastGrapheme && emojiRegex.test(lastGrapheme) && !usedEmojis.has(lastGrapheme)) {
    return trimmedContent;
  }

  const baseContent = lastGrapheme && emojiRegex.test(lastGrapheme)
    ? trimmedContent.slice(0, -lastGrapheme.length).trim()
    : trimmedContent;
  const replacementEmoji = getFreshSignatureEmoji(usedEmojis);

  if (!replacementEmoji) {
    throw new Error('Could not find an unused emoji signature');
  }

  return `${baseContent} ${replacementEmoji}`;
}
