'use client'

import { FormEvent, useRef, useState } from 'react'
import { Check, Plus, Trash2 } from 'lucide-react'

type DayTask = {
  id: string
  time: string
  title: string
  detail: string
  color: string
  icon: string
  done?: boolean
}

type DayDemoProps = {
  initialTasks: DayTask[]
}

const tintCycle = ['mint', 'lavender', 'peach']

export default function DayDemo({ initialTasks }: DayDemoProps) {
  const [tasks, setTasks] = useState(initialTasks.map((task) => ({ ...task })))
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const nextTaskId = useRef(0)

  const addTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const title = newTaskTitle.trim()
    if (!title || tasks.length >= 6) return

    nextTaskId.current += 1
    setTasks((currentTasks) => [
      ...currentTasks,
      {
        id: `added-${nextTaskId.current}`,
        time: 'Flexible',
        title,
        detail: 'Added by you',
        color: tintCycle[currentTasks.length % tintCycle.length],
        icon: '📝',
      },
    ])
    setNewTaskTitle('')
  }

  const toggleTask = (taskId: string) => {
    setTasks((currentTasks) => currentTasks.map((task) =>
      task.id === taskId ? { ...task, done: !task.done } : task,
    ))
  }

  const removeTask = (taskId: string) => {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId))
  }

  return (
    <div className="day-demo">
      <div className="demo-heading">
        <div>
          <div className="schedule-kicker">YOUR PERSONAL PLAN</div>
          <h3>Today, in flow</h3>
        </div>
        <span className="demo-day-label">A flexible day</span>
      </div>
      {tasks.length ? (
        <ul className="demo-task-list">
          {tasks.map((task) => (
            <li className={`demo-task ${task.done ? 'demo-task-done' : ''}`} key={task.id}>
              <span className="time-label">{task.time}</span>
              <span className={`event-icon ${task.color}`} aria-hidden="true">{task.icon}</span>
              <span className="event-text">
                <strong>{task.title}</strong>
                <small>{task.detail}</small>
              </span>
              <button
                className="task-done-button"
                type="button"
                aria-label={task.done ? `Mark ${task.title} not done` : `Mark ${task.title} done`}
                aria-pressed={Boolean(task.done)}
                onClick={() => toggleTask(task.id)}
              >
                <Check size={15}/>
              </button>
              <button
                className="task-remove-button"
                type="button"
                aria-label={`Remove ${task.title}`}
                onClick={() => removeTask(task.id)}
              >
                <Trash2 size={15}/>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="demo-empty">Nothing on the plan yet. Add one small thing to get started.</p>
      )}
      <form className="add-task-form" onSubmit={addTask}>
        <label htmlFor="new-day-task">Add a task</label>
        <div className="add-task-controls">
          <input
            id="new-day-task"
            type="text"
            value={newTaskTitle}
            onChange={(event) => setNewTaskTitle(event.target.value)}
            placeholder="What would you like to do?"
            maxLength={70}
            disabled={tasks.length >= 6}
          />
          <button type="submit" disabled={!newTaskTitle.trim() || tasks.length >= 6}>
            <Plus size={15}/> Add
          </button>
        </div>
        {tasks.length >= 6 && <small className="task-limit-note">This demo is full. Remove a task to add another.</small>}
      </form>
      <p className="demo-note">Flowtives suggested this plan. Change anything you don&apos;t like.</p>
    </div>
  )
}