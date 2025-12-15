import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

const API_URL = import.meta.env.VITE_API as string;

interface TextWithMentionsProps {
  text: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * Component that parses text and converts @username mentions into clickable links
 * that navigate to user profiles
 */
const TextWithMentions: React.FC<TextWithMentionsProps> = ({
  text,
  className = "",
  onClick,
}) => {
  const navigate = useNavigate();
  const { getIdTokenClaims, isAuthenticated } = useAuth0();
  const [loadingUsername, setLoadingUsername] = useState<string | null>(null);

  const handleUsernameClick = async (e: React.MouseEvent, username: string) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      // Silently return - don't show any error
      return;
    }

    setLoadingUsername(username);
    try {
      const tokenClaims = await getIdTokenClaims();
      if (!tokenClaims) {
        setLoadingUsername(null);
        return;
      }

      const token = tokenClaims.__raw;
      const response = await fetch(`${API_URL}/users/username/${username}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const userData = await response.json();
        navigate(`/user/${userData.id}`);
      } else {
        // Silently handle - don't show error for invalid mentions
        // User can type any text with @, it's not an error if it's not a valid user
        // Just reset loading state
      }
    } catch (error) {
      // Silently handle errors - don't show any error messages
    } finally {
      setLoadingUsername(null);
    }
  };

  // Parse text and convert @username mentions into clickable links
  const parseText = (text: string): React.ReactNode[] => {
    // Regex to match @username (username can contain letters, numbers, underscores, hyphens)
    // The @ must be at the start of the string or after whitespace
    const mentionRegex = /(?:^|\s)(@[\w-]+)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let keyCounter = 0;

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before the mention
      // match.index points to the start of the full match (space + @username or just @username)
      // If match.index > 0, there's a space before, so we include text up to and including the space
      const textEnd = match.index > 0 ? match.index + 1 : match.index;
      if (textEnd > lastIndex) {
        parts.push(text.substring(lastIndex, textEnd));
      }

      const mention = match[1]; // Includes the @
      if (!mention) continue; // Skip if no mention found

      const username = mention.substring(1); // Remove the @

      // Add the clickable mention (will handle invalid users gracefully)
      parts.push(
        <span
          key={`mention-${keyCounter++}`}
          onClick={(e) => handleUsernameClick(e, username)}
          className="text-purple-300 hover:text-purple-200 cursor-pointer transition-colors"
          title={`View @${username}'s profile`}
        >
          {loadingUsername === username ? "..." : mention}
        </span>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
  };

  return (
    <p className={className} onClick={onClick}>
      {parseText(text)}
    </p>
  );
};

export default TextWithMentions;
