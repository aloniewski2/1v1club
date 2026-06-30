import { useState } from 'react'
import { Copy, Check, Share2 } from 'lucide-react'
import { buildInviteUrl } from '../lib/wagerUtils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Props {
  inviteToken: string
}

export default function InviteSharePanel({ inviteToken }: Props) {
  const [copied, setCopied] = useState(false)
  const url = buildInviteUrl(inviteToken)

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({ title: '1v1 Club', text: 'Accept my challenge!', url })
    } else {
      handleCopy()
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Share invite link</p>
      <div className="flex gap-2">
        <Input value={url} readOnly className="text-xs font-mono" />
        <Button variant="outline" size="icon" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
        <Button variant="outline" size="icon" onClick={handleShare}>
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Link expires in 7 days. Share it with your opponent to start the challenge.</p>
    </div>
  )
}
