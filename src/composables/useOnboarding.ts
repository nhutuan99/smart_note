import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const ONBOARDING_KEY = 'finnote_onboarding_completed'
const TOTAL_STEPS = 4

/**
 * Composable to manage onboarding wizard state.
 * Persists completion flag in localStorage.
 */
export function useOnboarding() {
  const router = useRouter()
  const currentStep = ref(1)

  const isCompleted = computed(() =>
    localStorage.getItem(ONBOARDING_KEY) === 'true'
  )

  const progress = computed(() =>
    Math.round((currentStep.value / TOTAL_STEPS) * 100)
  )

  function nextStep() {
    if (currentStep.value < TOTAL_STEPS) {
      currentStep.value++
    }
  }

  function prevStep() {
    if (currentStep.value > 1) {
      currentStep.value--
    }
  }

  function skipToEnd() {
    currentStep.value = TOTAL_STEPS
  }

  function completeOnboarding() {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    router.push('/')
  }

  function resetOnboarding() {
    localStorage.removeItem(ONBOARDING_KEY)
  }

  return {
    currentStep,
    isCompleted,
    progress,
    totalSteps: TOTAL_STEPS,
    nextStep,
    prevStep,
    skipToEnd,
    completeOnboarding,
    resetOnboarding
  }
}
