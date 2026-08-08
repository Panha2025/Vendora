import { useState } from 'react'

const languageOptions = [
  { code: 'en', flag: 'uk', label: 'English' },
  { code: 'km', flag: 'kh', label: 'Khmer' },
  { code: 'zh', flag: 'cn', label: '\u4E2D\u6587' },
]

function FlagIcon({ code }) {
  return (
    <span className={`flag-icon flag-${code}`} aria-hidden="true">
      {code === 'uk' && (
        <>
          <span className="flag-uk-cross-white" />
          <span className="flag-uk-cross-red" />
          <span className="flag-uk-diagonal-white one" />
          <span className="flag-uk-diagonal-white two" />
          <span className="flag-uk-diagonal-red one" />
          <span className="flag-uk-diagonal-red two" />
        </>
      )}
      {code === 'kh' && <span className="flag-kh-temple" />}
      {code === 'cn' && (
        <>
          <span className="flag-cn-star main" />
          <span className="flag-cn-star small one" />
          <span className="flag-cn-star small two" />
        </>
      )}
    </span>
  )
}

function LanguageSelect({ className = '', label = 'Language', language, onLanguageChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const selected = languageOptions.find((option) => option.code === language) || languageOptions[0]

  function chooseLanguage(code) {
    onLanguageChange(code)
    setIsOpen(false)
  }

  return (
    <div className={`language-select custom-language-select ${className}`} onBlur={() => setIsOpen(false)}>
      <span>{label}</span>
      <div className="language-select-control">
        <button
          aria-expanded={isOpen}
          aria-label={label}
          className="language-select-button"
          type="button"
          onClick={() => setIsOpen((open) => !open)}
        >
          <FlagIcon code={selected.flag} />
          <span>{selected.label}</span>
        </button>
        {isOpen && (
          <div className="language-options" role="listbox">
            {languageOptions.map((option) => (
              <button
                className={option.code === selected.code ? 'active' : ''}
                key={option.code}
                role="option"
                type="button"
                aria-selected={option.code === selected.code}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => chooseLanguage(option.code)}
              >
                <FlagIcon code={option.flag} />
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default LanguageSelect
