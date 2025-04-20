import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { strToColor } from '@/app/utils/conv'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Avatar, AvatarImage } from '@radix-ui/react-avatar'
import { useCallback } from 'react'
import { LogOut } from 'lucide-react'
import { useAuthActions } from '@convex-dev/auth/react'

const UserProfile = () => {
    const me = useQuery(api.users.getMe, {})
    const { signOut } = useAuthActions()

    const handleSignOut = useCallback(async () => {
        void signOut()
    }, [signOut])

    return (
        <DropdownMenu>
            <DropdownMenuTrigger>
                <Avatar>
                    <AvatarImage
                        className="w-6 h-6 rounded-full border-[2px] border-[#dddddd] dark:border-dark-border"
                        src={me?.image}
                    />
                    {!me?.image && me?.name ? (
                        <div
                            style={{
                                borderColor: strToColor(me?.name),
                            }}
                            className="p-[3px] border-[1px] rounded-full text-[10px]">
                            SM
                        </div>
                    ) : null}
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="ml-3 p-1 dark:bg-dark-menu  border border-[#cecece] dark:border-dark-input-border">
                <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-[10px] dark:hover:bg-dark-menu-hover">
                    <LogOut />
                    Sign out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default UserProfile
