'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { formatNaira, getInitials } from '@/lib/utils'
import { memberSchema, validateForm } from '@/lib/validations'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { format } from 'date-fns'
import {
  Plus,
  Search,
  Pencil,
  Phone,
  MessageCircle,
  Upload,
  User,
  X,
  AlertCircle,
} from 'lucide-react'
import type { Member } from '@/types/database'

interface MemberWithTotal extends Member {
  total_paid: number
}

interface MembersListProps {
  initialMembers: MemberWithTotal[]
  monthlyContribution: number
}

export function MembersList({ initialMembers, monthlyContribution }: MembersListProps) {
  const [members, setMembers] = useState(initialMembers)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editingMember, setEditingMember] = useState<MemberWithTotal | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<string[]>([])

  const supabase = createClient()

  const filteredMembers = members.filter(
    (m) =>
      m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery)
  )

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB')
        return
      }
      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('Please upload a JPEG, PNG, or WebP image')
        return
      }
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadPhoto = async (memberId: string): Promise<string | null> => {
    if (!photoFile) return editingMember?.passport_url || null

    const fileExt = photoFile.name.split('.').pop()
    const fileName = `${memberId}.${fileExt}`
    const filePath = `passports/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('passports')
      .upload(filePath, photoFile, { upsert: true })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return null
    }

    return filePath
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormErrors([])

    // Check rate limit
    const { isLimited, retryAfter } = checkRateLimit('form', RATE_LIMITS.form)
    if (isLimited) {
      toast.error(`Please wait ${retryAfter} seconds before submitting again`)
      return
    }

    const formData = new FormData(e.currentTarget)
    const rawData = {
      full_name: formData.get('full_name') as string,
      phone: formData.get('phone') as string,
      email: (formData.get('email') as string) || null,
      whatsapp: (formData.get('whatsapp') as string) || null,
      notes: (formData.get('notes') as string) || null,
      status: (formData.get('status') as 'active' | 'left') || 'active',
    }

    // Validate input
    const validation = validateForm(memberSchema, rawData)
    if (!validation.success) {
      setFormErrors(validation.errors)
      return
    }

    setIsLoading(true)

    try {
      if (editingMember) {
        const passportUrl = await uploadPhoto(editingMember.id)

        const { error } = await supabase
          .from('members')
          .update({ ...validation.data, passport_url: passportUrl })
          .eq('id', editingMember.id)

        if (error) throw error

        setMembers((prev) =>
          prev.map((m) =>
            m.id === editingMember.id
              ? { ...m, ...validation.data, passport_url: passportUrl }
              : m
          )
        )
        toast.success('Member updated')
      } else {
        const { data: newMember, error } = await supabase
          .from('members')
          .insert([validation.data])
          .select()
          .single()

        if (error) throw error

        if (photoFile && newMember) {
          const passportUrl = await uploadPhoto(newMember.id)
          if (passportUrl) {
            await supabase
              .from('members')
              .update({ passport_url: passportUrl })
              .eq('id', newMember.id)
            newMember.passport_url = passportUrl
          }
        }

        setMembers((prev) => [{ ...newMember, total_paid: 0 }, ...prev])
        toast.success('Member added')
      }

      handleCloseDialog()
    } catch (error: unknown) {
      const err = error as { message?: string }
      toast.error(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingMember(null)
    setPhotoFile(null)
    setPhotoPreview(null)
    setFormErrors([])
  }

  const handleEdit = (member: MemberWithTotal) => {
    setEditingMember(member)
    setPhotoPreview(null)
    setPhotoFile(null)
    setFormErrors([])
    setIsDialogOpen(true)
  }

  const getPhotoUrl = (member: Member) => {
    if (!member.passport_url) return null
    const { data } = supabase.storage.from('passports').getPublicUrl(member.passport_url)
    return data.publicUrl
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Members</h1>
          <p className="text-muted-foreground mt-1">Manage your group members</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingMember(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingMember ? 'Edit Member' : 'Add New Member'}
                </DialogTitle>
                <DialogDescription>
                  {editingMember
                    ? 'Update member information'
                    : 'Add a new member to your group'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {formErrors.length > 0 && (
                  <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                    <div className="flex gap-2">
                      <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                      <div className="text-sm text-destructive">
                        {formErrors.map((error, i) => (
                          <p key={i}>{error}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Photo Upload */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-20 h-20 border-2 border-dashed border-muted-foreground/25">
                      {photoPreview ? (
                        <AvatarImage src={photoPreview} />
                      ) : editingMember?.passport_url ? (
                        <AvatarImage src={getPhotoUrl(editingMember) || undefined} />
                      ) : (
                        <AvatarFallback className="text-2xl">
                          <User className="w-8 h-8 text-muted-foreground" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    {photoPreview && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => {
                          setPhotoFile(null)
                          setPhotoPreview(null)
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <Label
                    htmlFor="photo"
                    className="cursor-pointer text-sm text-primary hover:underline flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Photo
                  </Label>
                  <input
                    id="photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </div>

                {/* Form Fields */}
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    required
                    defaultValue={editingMember?.full_name}
                    placeholder="Enter full name"
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    required
                    defaultValue={editingMember?.phone}
                    placeholder="08012345678"
                    maxLength={15}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={editingMember?.email || ''}
                      placeholder="email@example.com"
                      maxLength={255}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      name="whatsapp"
                      defaultValue={editingMember?.whatsapp || ''}
                      placeholder="08012345678"
                      maxLength={15}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue={editingMember?.status || 'active'}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="left">Left</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    defaultValue={editingMember?.notes || ''}
                    placeholder="Any additional notes..."
                    rows={3}
                    maxLength={500}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isLoading}>
                  {editingMember ? 'Save Changes' : 'Add Member'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {members.filter((m) => m.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Contribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNaira(monthlyContribution)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNaira(members.reduce((sum, m) => sum + m.total_paid, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Members Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Member</TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                  <TableHead className="hidden lg:table-cell">Join Date</TableHead>
                  <TableHead>Total Paid</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchQuery ? 'No members found' : 'No members yet'}
                      </div>
                      {!searchQuery && (
                        <Button
                          variant="link"
                          onClick={() => setIsDialogOpen(true)}
                          className="mt-2"
                        >
                          Add your first member
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar
                            className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary/50 rounded-lg"
                            style={{ transition: 'box-shadow 0.15s cubic-bezier(0.33, 1, 0.68, 1)' }}
                            onClick={() => {
                              const url = getPhotoUrl(member)
                              if (url) setEnlargedPhoto(url)
                            }}
                          >
                            {member.passport_url ? (
                              <AvatarImage src={getPhotoUrl(member) || undefined} />
                            ) : (
                              <AvatarFallback className="bg-primary/10 text-primary rounded-lg">
                                {getInitials(member.full_name)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.full_name}</p>
                            <p className="text-sm text-muted-foreground md:hidden">
                              {member.phone}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          {member.phone}
                        </div>
                        {member.whatsapp && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <MessageCircle className="w-3 h-3" />
                            {member.whatsapp}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {format(new Date(member.join_date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{formatNaira(member.total_paid)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.status === 'active' ? 'success' : 'secondary'}>
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(member)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Photo Enlargement Dialog */}
      <Dialog open={!!enlargedPhoto} onOpenChange={() => setEnlargedPhoto(null)}>
        <DialogContent className="max-w-sm p-2">
          {enlargedPhoto && (
            <img src={enlargedPhoto} alt="Member photo" className="w-full h-auto rounded-md" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
