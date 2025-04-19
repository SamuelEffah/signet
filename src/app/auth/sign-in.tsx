'use client'
import { useAuthActions } from '@convex-dev/auth/react'
import { Github } from 'lucide-react'

export function SignIn() {
    const { signIn } = useAuthActions()
    return (
        <div className="flex justify-center  h-[100vh]">
            <div className="border-[#cecece] mt-20 dark:bg-dark-modal border-[1px] h-[200px] rounded-sm px-4 flex justify-center  dark:border-dark-input-border w-[250px]">
                <button
                    type="button"
                    className="flex w-full items-center h-[30px] bg-dark-secondary rounded-sm p-1 mt-10"
                    onClick={() => void signIn('github')}>
                    <Github className="mx-2" size={14} />
                    Sign in with GitHub
                </button>
            </div>
        </div>
    )
}

export default SignIn
