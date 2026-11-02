import React, { useState, useEffect } from 'react';

interface TypewriterTextProps {
  words: string[];
  delay?: number;
  className?: string;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  words,
  delay = 120,
  className = ''
}) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const word = words[currentWordIndex];

    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        setCurrentText(word.substring(0, currentText.length + 1));
        if (currentText.length === word.length) {
          // Pause at end of word
          setTimeout(() => setIsDeleting(true), 1800);
        }
      } else {
        // Deleting
        setCurrentText(word.substring(0, currentText.length - 1));
        if (currentText.length === 0) {
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, isDeleting ? delay / 2 : delay);

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, currentWordIndex, words, delay]);

  return (
    <span className={`inline-block ${className}`}>
      <span>{currentText}</span>
      <span className="inline-block w-[3px] h-6 sm:h-8 bg-emerald-500 ml-1 animate-pulse align-middle" />
    </span>
  );
};
