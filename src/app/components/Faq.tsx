'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const questions = [
  {
    question: 'What file types can I upload?',
    answer: 'You can upload a PDF, image, or spreadsheet timetable.',
  },
  
  {
    question: 'Can I edit the AI’s plan?',
    answer: 'Yes. Add, remove, or change tasks so the plan fits your day.',
  }
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
            </div>
          </article>
        )
      })}
    </div>
  )
}