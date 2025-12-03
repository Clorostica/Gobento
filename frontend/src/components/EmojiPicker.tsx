import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onGifSelect?: (gifUrl: string) => void;
}

const EMOJI_CATEGORIES = {
  "Smileys & People": [
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "🤣",
    "😂",
    "🙂",
    "🙃",
    "😉",
    "😊",
    "😇",
    "🥰",
    "😍",
    "🤩",
    "😘",
    "😗",
    "😚",
    "😙",
    "😋",
    "😛",
    "😜",
    "🤪",
    "😝",
    "🤑",
    "🤗",
    "🤭",
    "🤫",
    "🤔",
    "🤐",
    "🤨",
    "😐",
    "😑",
    "😶",
    "😏",
    "😒",
    "🙄",
    "😬",
    "🤥",
    "😌",
    "😔",
    "😪",
    "🤤",
    "😴",
    "😷",
    "🤒",
    "🤕",
    "🤢",
    "🤮",
    "🤧",
    "🥵",
    "🥶",
    "😶‍🌫️",
    "😵",
    "😵‍💫",
    "🤯",
    "🤠",
    "🥳",
    "😎",
    "🤓",
    "🧐",
    "😕",
    "😟",
    "🙁",
    "☹️",
    "😮",
    "😯",
    "😲",
    "😳",
    "🥺",
    "😦",
    "😧",
    "😨",
    "😰",
    "😥",
    "😢",
    "😭",
    "😱",
    "😖",
    "😣",
    "😞",
    "😓",
    "😩",
    "😫",
    "🥱",
    "😤",
    "😡",
    "😠",
    "🤬",
    "😈",
    "👿",
    "💀",
    "☠️",
    "💩",
    "🤡",
    "👹",
    "👺",
    "👻",
    "👽",
    "👾",
    "🤖",
    "😺",
    "😸",
    "😹",
    "😻",
    "😼",
    "😽",
    "🙀",
    "😿",
    "😾",
    "🙈",
    "🙉",
    "🙊",
    "💋",
    "💌",
    "💘",
    "💝",
    "💖",
    "💗",
    "💓",
    "💞",
    "💕",
    "💟",
    "❣️",
    "💔",
    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🖤",
    "🤍",
    "🤎",
    "💯",
    "💢",
    "💥",
    "💫",
    "💦",
    "💨",
    "🕳️",
    "💣",
    "💬",
    "👤",
    "👥",
    "🗣️",
    "👶",
    "🧒",
    "👦",
    "👧",
    "🧑",
    "👨",
    "👩",
    "🧓",
    "👴",
    "👵",
    "🙍",
    "🙎",
    "🙅",
    "🙆",
    "💁",
    "🙋",
    "🧏",
    "🤦",
    "🤷",
    "👮",
    "🕵️",
    "💂",
    "🥷",
    "👷",
    "🤴",
    "👸",
    "👳",
    "👲",
    "🧕",
    "🤵",
    "👰",
    "🤰",
    "🤱",
    "👼",
    "🎅",
    "🤶",
    "🦸",
    "🦹",
    "🧙",
    "🧚",
    "🧛",
    "🧜",
    "🧝",
    "🧞",
    "🧟",
    "💆",
    "💇",
    "🚶",
    "🧍",
    "🧎",
    "🏃",
    "💃",
    "🕺",
    "🕴️",
    "👯",
    "🧘",
    "🧗",
    "🤺",
    "🏇",
    "⛷️",
    "🏂",
    "🏌️",
    "🏄",
    "🚣",
    "🏊",
    "⛹️",
    "🏋️",
    "🚴",
    "🚵",
    "🤸",
    "🤼",
    "🤽",
    "🤾",
    "🤹",
    "🧗‍♂️",
    "🧗‍♀️",
    "👨‍👩‍👦",
    "👨‍👩‍👧",
    "👨‍👩‍👧‍👦",
    "👨‍👩‍👦‍👦",
    "👨‍👩‍👧‍👧",
  ],
  "Animals & Nature": [
    "🐶",
    "🐱",
    "🐭",
    "🐹",
    "🐰",
    "🦊",
    "🐻",
    "🐼",
    "🐨",
    "🐯",
    "🦁",
    "🐮",
    "🐷",
    "🐽",
    "🐸",
    "🐵",
    "🙈",
    "🙉",
    "🙊",
    "🐒",
    "🐔",
    "🐧",
    "🐦",
    "🐤",
    "🐣",
    "🐥",
    "🦆",
    "🦅",
    "🦉",
    "🦇",
    "🐺",
    "🐗",
    "🐴",
    "🦄",
    "🐝",
    "🐛",
    "🦋",
    "🐌",
    "🐞",
    "🐜",
    "🦟",
    "🦗",
    "🕷️",
    "🦂",
    "🐢",
    "🐍",
    "🦎",
    "🦖",
    "🦕",
    "🐙",
    "🦑",
    "🦐",
    "🦞",
    "🦀",
    "🐡",
    "🐠",
    "🐟",
    "🐬",
    "🐳",
    "🐋",
    "🦈",
    "🐊",
    "🐅",
    "🐆",
    "🦓",
    "🦍",
    "🦧",
    "🐘",
    "🦛",
    "🦏",
    "🐪",
    "🐫",
    "🦒",
    "🦘",
    "🦬",
    "🐃",
    "🐂",
    "🐄",
    "🐎",
    "🐖",
    "🐏",
    "🐑",
    "🦙",
    "🐐",
    "🦌",
    "🐕",
    "🐩",
    "🦮",
    "🐕‍🦺",
    "🐈",
    "🐓",
    "🦃",
    "🦤",
    "🦚",
    "🦜",
    "🦢",
    "🦩",
    "🕊️",
    "🐇",
    "🦝",
    "🦨",
    "🦡",
    "🦫",
    "🦦",
    "🦥",
    "🐁",
    "🐀",
    "🐿️",
    "🦔",
    "🌲",
    "🌳",
    "🌴",
    "🌵",
    "🌶️",
    "🌷",
    "🌺",
    "🌻",
    "🌼",
    "🌽",
    "🌾",
  ],
  "Food & Drink": [
    "🍏",
    "🍎",
    "🍐",
    "🍊",
    "🍋",
    "🍌",
    "🍉",
    "🍇",
    "🍓",
    "🍈",
    "🍒",
    "🍑",
    "🥭",
    "🍍",
    "🥥",
    "🥝",
    "🍅",
    "🍆",
    "🥑",
    "🥦",
    "🥬",
    "🥒",
    "🌶️",
    "🌽",
    "🥕",
    "🥔",
    "🍠",
    "🥐",
    "🥯",
    "🍞",
    "🥖",
    "🥨",
    "🧀",
    "🥚",
    "🍳",
    "🥞",
    "🥓",
    "🥩",
    "🍗",
    "🍖",
    "🦴",
    "🌭",
    "🍔",
    "🍟",
    "🍕",
    "🥪",
    "🥙",
    "🌮",
    "🌯",
    "🥗",
    "🥘",
    "🥫",
    "🍝",
    "🍜",
    "🍲",
    "🍛",
    "🍣",
    "🍱",
    "🥟",
    "🦪",
    "🍤",
    "🍙",
    "🍚",
    "🍘",
    "🍥",
    "🥠",
    "🥮",
    "🍢",
    "🍡",
    "🍧",
    "🍨",
    "🍦",
    "🥧",
    "🍰",
    "🎂",
    "🍮",
    "🍭",
    "🍬",
    "🍫",
    "🍿",
    "🍩",
    "🍪",
    "🌰",
    "🥜",
    "🍯",
    "🥛",
    "🍼",
    "☕",
    "🍵",
    "🧃",
    "🥤",
    "🍶",
    "🍺",
    "🍻",
    "🥂",
    "🍷",
    "🥃",
    "🍸",
    "🍹",
    "🧉",
    "🍾",
    "🧊",
  ],
  "Travel & Places": [
    "🚗",
    "🚕",
    "🚙",
    "🚌",
    "🚎",
    "🏎️",
    "🚓",
    "🚑",
    "🚒",
    "🚐",
    "🛻",
    "🚚",
    "🚛",
    "🚜",
    "🏍️",
    "🛵",
    "🚲",
    "🛴",
    "🛹",
    "🛼",
    "🚔",
    "🚍",
    "🚘",
    "🚖",
    "🚡",
    "🚠",
    "🚟",
    "🚃",
    "🚋",
    "🚞",
    "🚝",
    "🚄",
    "🚅",
    "🚈",
    "🚂",
    "🚆",
    "🚇",
    "🚊",
    "🚉",
    "✈️",
    "🛫",
    "🛬",
    "🛩️",
    "💺",
    "🚁",
    "🚟",
    "🚡",
    "🚀",
    "🛸",
    "🚤",
    "🛥️",
    "🛳️",
    "⛴️",
    "🚢",
    "⚓",
    "⛽",
    "🚧",
    "🚦",
    "🚥",
    "🗺️",
    "🗿",
    "🗽",
    "🗼",
    "🏰",
    "🏯",
    "🏟️",
    "🎡",
    "🎢",
    "🎠",
    "⛲",
    "⛱️",
    "🏖️",
    "🏝️",
    "🏜️",
    "🌋",
    "⛰️",
    "🏔️",
    "🗻",
    "🏕️",
    "⛺",
    "🏠",
    "🏡",
    "🏘️",
    "🏚️",
    "🏗️",
    "🏭",
    "🏢",
    "🏬",
    "🏣",
    "🏤",
    "🏥",
    "🏦",
    "🏨",
    "🏪",
    "🏫",
    "🏩",
    "💒",
    "🏛️",
    "⛪",
    "🕌",
    "🕍",
    "🛕",
    "🕋",
    "⛩️",
    "🛤️",
    "🛣️",
    "🗾",
    "🎑",
    "🏞️",
    "🌅",
    "🌄",
    "🌠",
    "🎇",
    "🎆",
    "🌇",
    "🌆",
    "🏙️",
    "🌃",
    "🌌",
    "🌉",
    "🌁",
  ],
  Activities: [
    "⚽",
    "🏀",
    "🏈",
    "⚾",
    "🥎",
    "🎾",
    "🏐",
    "🏉",
    "🥏",
    "🎱",
    "🏓",
    "🏸",
    "🏒",
    "🏑",
    "🥍",
    "🏏",
    "🥅",
    "⛳",
    "🏹",
    "🎣",
    "🥊",
    "🥋",
    "🎽",
    "🛹",
    "🛷",
    "⛸️",
    "🥌",
    "🎿",
    "⛷️",
    "🏂",
    "🤺",
    "🏌️",
    "🏇",
    "🧘",
    "🏄",
    "🏊",
    "🚣",
    "🧗",
    "🚵",
    "🚴",
    "🏆",
    "🥇",
    "🥈",
    "🥉",
    "🏅",
    "🎖️",
    "🏵️",
    "🎗️",
    "🎫",
    "🎟️",
    "🎪",
    "🤹",
    "🎭",
    "🩰",
    "🎨",
    "🎬",
    "🎤",
    "🎧",
    "🎼",
    "🎹",
    "🥁",
    "🎷",
    "🎺",
    "🎸",
    "🪕",
    "🎻",
    "🎲",
    "🎯",
    "🎳",
    "🎮",
    "🎰",
    "🧩",
  ],
  Objects: [
    "⌚",
    "📱",
    "📲",
    "💻",
    "⌨️",
    "🖥️",
    "🖨️",
    "🖱️",
    "🖲️",
    "🕹️",
    "🗜️",
    "💾",
    "💿",
    "📀",
    "📼",
    "📷",
    "📸",
    "📹",
    "🎥",
    "📽️",
    "🎞️",
    "📞",
    "☎️",
    "📟",
    "📠",
    "📺",
    "📻",
    "🎙️",
    "🎚️",
    "🎛️",
    "🧭",
    "⏱️",
    "⏲️",
    "⏰",
    "🕰️",
    "⌛",
    "⏳",
    "📡",
    "🔋",
    "🔌",
    "💡",
    "🔦",
    "🕯️",
    "🧯",
    "🪔",
    "🧸",
    "🛍️",
    "🛒",
    "🎁",
    "🎈",
    "🎏",
    "🎀",
    "🎊",
    "🎉",
    "🎎",
    "🏮",
    "🎐",
    "🧧",
    "✉️",
    "📩",
    "📨",
    "📧",
    "💌",
    "📥",
    "📤",
    "📦",
    "🏷️",
    "📪",
    "📫",
    "📬",
    "📭",
    "📮",
    "📯",
    "📜",
    "📃",
    "📄",
    "📑",
    "📊",
    "📈",
    "📉",
    "🗒️",
    "🗓️",
    "📆",
    "📅",
    "🗑️",
    "📇",
    "🗃️",
    "🗳️",
    "🗄️",
    "📋",
    "📁",
    "📂",
    "🗂️",
    "🗞️",
    "📰",
    "📓",
    "📔",
    "📒",
    "📕",
    "📗",
    "📘",
    "📙",
    "📚",
    "📖",
    "🔖",
    "🧷",
    "🔗",
    "📎",
    "🖇️",
    "📐",
    "📏",
    "🧮",
    "📌",
    "📍",
    "✂️",
    "🖊️",
    "🖋️",
    "✒️",
    "🖌️",
    "🖍️",
    "📝",
    "✏️",
    "🔍",
    "🔎",
    "🔏",
    "🔐",
    "🔒",
    "🔓",
  ],
  Symbols: [
    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🖤",
    "🤍",
    "🤎",
    "💔",
    "❣️",
    "💕",
    "💞",
    "💓",
    "💗",
    "💖",
    "💘",
    "💝",
    "💟",
    "☮️",
    "✝️",
    "☪️",
    "🕉️",
    "☸️",
    "✡️",
    "🔯",
    "🕎",
    "☯️",
    "☦️",
    "🛐",
    "⛎",
    "♈",
    "♉",
    "♊",
    "♋",
    "♌",
    "♍",
    "♎",
    "♏",
    "♐",
    "♑",
    "♒",
    "♓",
    "🆔",
    "⚛️",
    "🉑",
    "☢️",
    "☣️",
    "📴",
    "📳",
    "🈶",
    "🈚",
    "🈸",
    "🈺",
    "🈷️",
    "✴️",
    "🆚",
    "💮",
    "🉐",
    "㊙️",
    "㊗️",
    "🈴",
    "🈵",
    "🈹",
    "🈲",
    "🅰️",
    "🅱️",
    "🆎",
    "🆑",
    "🅾️",
    "🆘",
    "❌",
    "⭕",
    "🛑",
    "⛔",
    "📛",
    "🚫",
    "💯",
    "💢",
    "♨️",
    "🚷",
    "🚯",
    "🚳",
    "🚱",
    "🔞",
    "📵",
    "🚭",
    "❗",
    "❕",
    "❓",
    "❔",
    "‼️",
    "⁉️",
    "🔅",
    "🔆",
    "〽️",
    "⚠️",
    "🚸",
    "🔱",
    "⚜️",
    "🔰",
    "♻️",
    "✅",
    "🈯",
    "💹",
    "❇️",
    "✳️",
    "❎",
    "🌐",
    "💠",
    "Ⓜ️",
    "🌀",
    "💤",
    "🏧",
    "🚾",
    "♿",
    "🅿️",
    "🈳",
    "🈂️",
    "🛂",
    "🛃",
    "🛄",
    "🛅",
    "🚹",
    "🚺",
    "🚼",
    "🚻",
    "🚮",
    "🎦",
    "📶",
    "🈁",
    "🔣",
    "ℹ️",
    "🔤",
    "🔡",
    "🔠",
    "🔢",
    "🔟",
    "🔯",
    "🔮",
    "🆕",
    "🆓",
    "🆒",
    "🆗",
    "🆙",
    "🆚",
    "🈁",
    "🈂️",
    "🈷️",
    "🈶",
    "🈯",
    "🉐",
    "🈹",
    "🈲",
    "🉑",
    "🈸",
    "🈴",
    "🈳",
    "㊗️",
    "㊙️",
    "🈺",
    "🈵",
    "🔴",
    "🟠",
    "🟡",
    "🟢",
    "🔵",
    "🟣",
    "⚫",
    "⚪",
    "🟤",
    "🔶",
    "🔷",
    "🔸",
    "🔹",
    "🔺",
    "🔻",
    "💠",
    "🔘",
    "🔳",
    "🔲",
  ],
};

export default function EmojiPicker({
  onEmojiSelect,
  onGifSelect,
}: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const firstCategoryKey =
    Object.keys(EMOJI_CATEGORIES)[0] || "Smileys & People";
  const [activeCategory, setActiveCategory] =
    useState<string>(firstCategoryKey);
  const [showGifSearch, setShowGifSearch] = useState(false);
  const [gifSearchQuery, setGifSearchQuery] = useState("");
  const [gifResults, setGifResults] = useState<string[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const emojiContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const popup = document.querySelector(".emoji-picker-popup");
      if (
        popup &&
        !popup.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Use setTimeout to avoid immediate closure
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Check scroll position to show/hide scroll arrows
  useEffect(() => {
    const checkScroll = () => {
      if (emojiContainerRef.current && !showGifSearch) {
        const container = emojiContainerRef.current;
        const hasScroll = container.scrollHeight > container.clientHeight;
        setShowScrollTop(container.scrollTop > 10 && hasScroll);
        setShowScrollBottom(
          container.scrollTop <
            container.scrollHeight - container.clientHeight - 10 && hasScroll
        );
      } else {
        setShowScrollTop(false);
        setShowScrollBottom(false);
      }
    };

    if (isOpen && emojiContainerRef.current) {
      checkScroll();
      emojiContainerRef.current.addEventListener("scroll", checkScroll);
      // Also check on resize
      window.addEventListener("resize", checkScroll);
    }

    return () => {
      if (emojiContainerRef.current) {
        emojiContainerRef.current.removeEventListener("scroll", checkScroll);
      }
      window.removeEventListener("resize", checkScroll);
    };
  }, [isOpen, showGifSearch, activeCategory]);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
  };

  const searchGifs = async (query: string) => {
    // Check if it's a URL
    if (query.startsWith("http://") || query.startsWith("https://")) {
      // Validate it's a GIF URL
      if (query.includes(".gif") || query.endsWith(".gif")) {
        if (onGifSelect) {
          onGifSelect(query);
          setIsOpen(false);
          setGifSearchQuery("");
        }
        return;
      }
    }

    // If not a URL, search using Giphy API (free tier)
    // You can add your Giphy API key in .env as VITE_GIPHY_API_KEY
    const giphyApiKey = (import.meta.env as any).VITE_GIPHY_API_KEY || "demo";

    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${giphyApiKey}&q=${encodeURIComponent(
          query
        )}&limit=20&rating=g`
      );
      const data = await response.json();

      if (data.data && Array.isArray(data.data)) {
        const gifUrls = data.data.map((gif: any) => gif.images.original.url);
        setGifResults(gifUrls);
      } else {
        setGifResults([]);
      }
    } catch (error) {
      console.error("Error searching GIFs:", error);
      // Fallback: if search fails, check if query is a direct GIF URL
      if (query.includes(".gif")) {
        setGifResults([query]);
      } else {
        setGifResults([]);
      }
    }
  };

  const [pickerPosition, setPickerPosition] = useState({
    top: "0px",
    left: "0px",
  });

  // Update position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const getPickerPosition = () => {
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          const popupHeight = 384; // h-96 = 24rem = 384px
          const popupWidth = 320; // w-80 = 20rem = 320px

          // Position above the button by default
          let top = rect.top - popupHeight - 8;
          let left = rect.left;

          // If not enough space above, position below
          if (top < 0) {
            top = rect.bottom + 8;
          }

          // If too far right, adjust left
          if (left + popupWidth > window.innerWidth) {
            left = window.innerWidth - popupWidth - 16;
          }

          // Ensure minimum margin from edges
          if (left < 8) {
            left = 8;
          }

          return {
            top: `${top}px`,
            left: `${left}px`,
          };
        }
        return { top: "0px", left: "0px" };
      };

      const position = getPickerPosition();
      setPickerPosition(position);
    }
  }, [isOpen]);

  return (
    <>
      <div className="relative" ref={pickerRef}>
        <button
          ref={buttonRef}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="px-2 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded text-sm transition-colors"
          title="Add emoji"
          type="button"
        >
          😀
        </button>
      </div>

      {isOpen &&
        createPortal(
          <div
            className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 w-80 h-96 flex flex-col overflow-hidden emoji-picker-popup"
            style={{
              top: pickerPosition.top,
              left: pickerPosition.left,
              zIndex: 99999,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Categories */}
            <div className="flex border-b border-gray-200 overflow-x-auto">
              <button
                onClick={() => {
                  setShowGifSearch(true);
                }}
                className={`px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                  showGifSearch
                    ? "bg-purple-100 text-purple-600 border-b-2 border-purple-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                GIF
              </button>
              {Object.keys(EMOJI_CATEGORIES).map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setActiveCategory(category);
                    setShowGifSearch(false);
                  }}
                  className={`px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                    activeCategory === category && !showGifSearch
                      ? "bg-purple-100 text-purple-600 border-b-2 border-purple-600"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {category.split(" ")[0]}
                </button>
              ))}
            </div>

            {/* GIF Search or Emojis */}
            {showGifSearch ? (
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={gifSearchQuery}
                    onChange={(e) => setGifSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && gifSearchQuery.trim()) {
                        searchGifs(gifSearchQuery.trim());
                      }
                    }}
                    placeholder="Search GIFs or paste URL..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  <button
                    onClick={() => {
                      if (gifSearchQuery.trim()) {
                        searchGifs(gifSearchQuery.trim());
                      }
                    }}
                    className="px-4 py-2 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 transition-colors"
                  >
                    Search
                  </button>
                </div>
                {gifResults.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {gifResults.map((gifUrl, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          if (onGifSelect) {
                            onGifSelect(gifUrl);
                          }
                          setIsOpen(false);
                          setGifSearchQuery("");
                          setGifResults([]);
                        }}
                        className="relative group aspect-video rounded overflow-hidden border-2 border-transparent hover:border-purple-400 transition-colors"
                      >
                        <img
                          src={gifUrl}
                          alt={`GIF ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                          <span className="text-white text-xs opacity-0 group-hover:opacity-100">
                            Click to add
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {gifResults.length === 0 && gifSearchQuery && (
                  <div className="text-center text-gray-500 text-sm py-8">
                    No GIFs found. Paste a GIF URL or search for one.
                  </div>
                )}
                {!gifSearchQuery && (
                  <div className="text-center text-gray-500 text-sm py-8">
                    Search for GIFs or paste a GIF URL
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 relative overflow-hidden">
                {showScrollTop && (
                  <button
                    onClick={() => {
                      if (emojiContainerRef.current) {
                        emojiContainerRef.current.scrollTo({
                          top: 0,
                          behavior: "smooth",
                        });
                      }
                    }}
                    className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10 bg-white border border-gray-300 rounded-full p-1 shadow-md hover:bg-gray-50 transition-all"
                    type="button"
                    title="Scroll up"
                  >
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                  </button>
                )}
                <div
                  ref={emojiContainerRef}
                  className="h-full overflow-y-auto p-3 scroll-smooth"
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "#cbd5e1 #f1f5f9",
                  }}
                >
                  {activeCategory &&
                  EMOJI_CATEGORIES[
                    activeCategory as keyof typeof EMOJI_CATEGORIES
                  ] ? (
                    <div className="grid grid-cols-8 gap-1">
                      {EMOJI_CATEGORIES[
                        activeCategory as keyof typeof EMOJI_CATEGORIES
                      ].map((emoji, index) => (
                        <button
                          key={`${activeCategory}-${index}`}
                          onClick={() => {
                            handleEmojiClick(emoji);
                            setIsOpen(false);
                          }}
                          className="text-2xl hover:bg-gray-100 rounded p-1 transition-colors flex items-center justify-center"
                          type="button"
                          title={emoji}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 text-sm py-8">
                      No emojis available
                    </div>
                  )}
                </div>
                {showScrollBottom && (
                  <button
                    onClick={() => {
                      if (emojiContainerRef.current) {
                        emojiContainerRef.current.scrollTo({
                          top: emojiContainerRef.current.scrollHeight,
                          behavior: "smooth",
                        });
                      }
                    }}
                    className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10 bg-white border border-gray-300 rounded-full p-1 shadow-md hover:bg-gray-50 transition-all"
                    type="button"
                    title="Scroll down"
                  >
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
