import { isEditable, isVoidable } from 'domain/transferRequest/shared'

describe('transfer request shared', () => {
  describe('isVoidable', () => {
    describe('should return true when', () => {
      it('is called with SUBMITTED status', () => {
        const result = isVoidable({ status: 'SUBMITTED' })
        expect(result).toEqual(true)
      })

      it('is called with REQUIRES_CHANGES status', () => {
        const result = isVoidable({ status: 'REQUIRES_CHANGES' })
        expect(result).toEqual(true)
      })
    })

    describe('should return false when', () => {
      it('is called with VOIDED status', () => {
        const result = isVoidable({ status: 'VOIDED' })
        expect(result).toEqual(false)
      })

      it('is called with REJECTED_BY_APPROVER status', () => {
        const result = isVoidable({ status: 'REJECTED_BY_APPROVER' })
        expect(result).toEqual(false)
      })

      it('is called with PAID status', () => {
        const result = isVoidable({ status: 'PAID' })
        expect(result).toEqual(false)
      })

      it('is called with REJECTED_BY_CONTROLLER status', () => {
        const result = isVoidable({ status: 'REJECTED_BY_CONTROLLER' })
        expect(result).toEqual(false)
      })

      it('is called with APPROVED status', () => {
        const result = isVoidable({ status: 'APPROVED' })
        expect(result).toEqual(false)
      })
    })
  })

  describe('isEditable', () => {
    describe('should return true when', () => {
      it('is called with SUBMITTED status', () => {
        const result = isEditable({ status: 'SUBMITTED' })
        expect(result).toEqual(true)
      })

      it('is called with REQUIRES_CHANGES status', () => {
        const result = isEditable({ status: 'REQUIRES_CHANGES' })
        expect(result).toEqual(true)
      })
    })

    describe('should return false when', () => {
      it('is called with VOIDED status', () => {
        const result = isEditable({ status: 'VOIDED' })
        expect(result).toEqual(false)
      })

      it('is called with REJECTED_BY_APPROVER status', () => {
        const result = isEditable({ status: 'REJECTED_BY_APPROVER' })
        expect(result).toEqual(false)
      })

      it('is called with PAID status', () => {
        const result = isEditable({ status: 'PAID' })
        expect(result).toEqual(false)
      })

      it('is called with REJECTED_BY_CONTROLLER status', () => {
        const result = isEditable({ status: 'REJECTED_BY_CONTROLLER' })
        expect(result).toEqual(false)
      })

      it('is called with APPROVED status', () => {
        const result = isEditable({ status: 'APPROVED' })
        expect(result).toEqual(false)
      })
    })
  })
})
