'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Submission, Bounty } from './mock-data'

type ModalType = 
  | 'wallet'
  | 'rating'
  | 'submission-review'
  | 'confirm-action'
  | null

interface ModalData {
  submission?: Submission
  bounty?: Bounty
  action?: {
    title: string
    message: string
    confirmText: string
    onConfirm: () => void
  }
}

interface ModalContextType {
  activeModal: ModalType
  modalData: ModalData
  openModal: (modal: ModalType, data?: ModalData) => void
  closeModal: () => void
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export function ModalProvider({ children }: { children: ReactNode }) {
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [modalData, setModalData] = useState<ModalData>({})

  const openModal = useCallback((modal: ModalType, data?: ModalData) => {
    setActiveModal(modal)
    setModalData(data || {})
  }, [])

  const closeModal = useCallback(() => {
    setActiveModal(null)
    setModalData({})
  }, [])

  return (
    <ModalContext.Provider value={{ activeModal, modalData, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  )
}

export function useModal() {
  const context = useContext(ModalContext)
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}
