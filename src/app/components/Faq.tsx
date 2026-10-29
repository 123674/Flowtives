'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const questions = [
  {
    question: 'What file types can I upload?',
    answer: 'You can upload a PDF, image, or spreadsheet timetable.',
  },
  {
    question: 'Is my data private?',
    answer: 'We are still finalizing how data is stored and handled. Please review the privacy details before uploading personal information.',
    todo: 'TODO(me): Confirm product privacy and data-retention policy.',
  },
  {
    question: 'Can I edit the AI’s plan?',
    answer: 'Yes. Add, remove, or change tasks so the plan fits your day.',
  },
  {
    question: 'Is it free?',
    answer: 'Pricing is still being decided, so we cannot confirm which features will be free yet.',
    todo: 'TODO(me): Confirm free tier and pricing.',
  },
  {
    question: 'Which calendars does it sync with?',
    answer: 'Calendar syncing is still being planned; no specific integrations are confirmed.',
    todo: 'TODO(me): Confirm supported calendar integrations.',
  },
]

export default function Faq() {
  const [openQuestion, setOpenQuestion] = useState<number | null>(null)

  return (
    <div className="faq-list">
      {questions.map((item, index) => {
        const isOpen = openQuestion === index
        const panelId = `faq-answer-${index + 1}`

        return (
          <article className="faq-item" key={item.question}>
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenQuestion(isOpen ? null : index)}
              >
                <span>{item.question}</span>
                <ChevronDown size={18} aria-hidden="true"/>
              </button>
            </h3>
            <div className="faq-answer" id={panelId} hidden={!isOpen}>
              <p>{item.answer}</p>
              {item.todo && <small>{'// '}{item.todo}</small>}
            </div>
          </article>
        )
      })}
    </div>
  )
}