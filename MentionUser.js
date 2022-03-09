import React, { useRef, useEffect } from "react";
import ImageUtils from "../../components/Utils/ImageUtils/ImageUtils";

export default function Entry({
  mention,
  isFocused,
  id,
  onMouseUp,
  onMouseDown,
  onMouseEnter
}) {
  const entryRef = useRef(null);
  let className = "mention-text";

  if (isFocused) {
    className += " mention-focused";
  }

  useEffect(() => {
    if (isFocused) {
      if ("scrollIntoViewIfNeeded" in document.body) {
        entryRef.current.scrollIntoViewIfNeeded(false);
      } else {
        entryRef.current.scrollIntoView(false);
      }
    }
  }, [isFocused]);

  return (
    <div
      ref={entryRef}
      className={className}
      role="option"
      aria-selected={isFocused ? "true" : "false"}
      id={id}
      onMouseUp={onMouseUp}
      onMouseEnter={onMouseEnter}
      onMouseDown={onMouseDown}
    >
      <div>        
      <ImageUtils src={mention.avatar} style={{ height: 32}} width= {32} name={mention.name}  />
        <span className="mr-2 ml-2">{mention.name}</span>
      </div>
    </div>
  );
}