"use client";

import { useState } from "react";
import {
  CircleAlert,
  CircleCheck,
  Info,
  TriangleAlert,
  ChevronDown,
  Settings,
  User,
  LogOut,
  Plus,
  Search,
  Copy,
  Trash2,
  Edit3,
  Eye,
  Shield,
  Key,
  Users,
  Building2,
  FolderOpen,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 mt-10 text-heading1 first:mt-0">{children}</h2>;
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="mb-3 text-heading3 text-DG">{title}</h3>
      {children}
    </div>
  );
}

export default function ComponentsPage() {
  const [switchValue, setSwitchValue] = useState(false);

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-heading1">UI Component Showcase</h1>
          <p className="mt-2 text-bodymedium">
            shadcn/ui 기반 컴포넌트 라이브러리 - 모든 색상, 폰트, 기능 확인
          </p>
        </div>

        <Separator className="my-8" />

        {/* ========== COLORS ========== */}
        <SectionTitle>Colors (컬러 팔레트)</SectionTitle>

        {/* ---- Red ---- */}
        <SubSection title="Red (rd) — #EB1700">
          <div className="grid grid-cols-10 gap-1.5">
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-rd-50" />
              <span className="text-tiny text-sv">50</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-rd-100" />
              <span className="text-tiny text-sv">100</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-rd-200" />
              <span className="text-tiny text-sv">200</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-rd-300" />
              <span className="text-tiny text-sv">300</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-rd-400" />
              <span className="text-tiny text-sv">400</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-rd-500" />
              <span className="text-tiny text-sv">500</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-rd-600" />
              <span className="text-tiny text-sv">600</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-rd-700" />
              <span className="text-tiny text-sv">700</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-rd-800" />
              <span className="text-tiny text-sv">800</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-rd-900" />
              <span className="text-tiny text-sv">900</span>
            </div>
          </div>
        </SubSection>

        {/* ---- Blue ---- */}
        <SubSection title="Blue — #1475F8">
          <div className="grid grid-cols-10 gap-1.5">
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-blue-50" />
              <span className="text-tiny text-sv">50</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-blue-100" />
              <span className="text-tiny text-sv">100</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-blue-200" />
              <span className="text-tiny text-sv">200</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-blue-300" />
              <span className="text-tiny text-sv">300</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-blue-400" />
              <span className="text-tiny text-sv">400</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-blue-500" />
              <span className="text-tiny text-sv">500</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-blue-600" />
              <span className="text-tiny text-sv">600</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-blue-700" />
              <span className="text-tiny text-sv">700</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-blue-800" />
              <span className="text-tiny text-sv">800</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-blue-900" />
              <span className="text-tiny text-sv">900</span>
            </div>
          </div>
        </SubSection>

        {/* ---- Green ---- */}
        <SubSection title="Green — #009E03">
          <div className="grid grid-cols-10 gap-1.5">
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-green-50" />
              <span className="text-tiny text-sv">50</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-green-100" />
              <span className="text-tiny text-sv">100</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-green-200" />
              <span className="text-tiny text-sv">200</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-green-300" />
              <span className="text-tiny text-sv">300</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-green-400" />
              <span className="text-tiny text-sv">400</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-green-500" />
              <span className="text-tiny text-sv">500</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-green-600" />
              <span className="text-tiny text-sv">600</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-green-700" />
              <span className="text-tiny text-sv">700</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-green-800" />
              <span className="text-tiny text-sv">800</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-green-900" />
              <span className="text-tiny text-sv">900</span>
            </div>
          </div>
        </SubSection>

        {/* ---- Yellow ---- */}
        <SubSection title="Yellow — #F57F17">
          <div className="grid grid-cols-10 gap-1.5">
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-yellow-50" />
              <span className="text-tiny text-sv">50</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-yellow-100" />
              <span className="text-tiny text-sv">100</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-yellow-200" />
              <span className="text-tiny text-sv">200</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-yellow-300" />
              <span className="text-tiny text-sv">300</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-yellow-400" />
              <span className="text-tiny text-sv">400</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-yellow-500" />
              <span className="text-tiny text-sv">500</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-yellow-600" />
              <span className="text-tiny text-sv">600</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-yellow-700" />
              <span className="text-tiny text-sv">700</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-yellow-800" />
              <span className="text-tiny text-sv">800</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-yellow-900" />
              <span className="text-tiny text-sv">900</span>
            </div>
          </div>
        </SubSection>

        {/* ---- Purple ---- */}
        <SubSection title="Purple — #7C3AED">
          <div className="grid grid-cols-10 gap-1.5">
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-purple-50" />
              <span className="text-tiny text-sv">50</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-purple-100" />
              <span className="text-tiny text-sv">100</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-purple-200" />
              <span className="text-tiny text-sv">200</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-purple-300" />
              <span className="text-tiny text-sv">300</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-purple-400" />
              <span className="text-tiny text-sv">400</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-purple-500" />
              <span className="text-tiny text-sv">500</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-purple-600" />
              <span className="text-tiny text-sv">600</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-purple-700" />
              <span className="text-tiny text-sv">700</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-purple-800" />
              <span className="text-tiny text-sv">800</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-purple-900" />
              <span className="text-tiny text-sv">900</span>
            </div>
          </div>
        </SubSection>

        {/* ---- Pink ---- */}
        <SubSection title="Pink — #EC4899">
          <div className="grid grid-cols-10 gap-1.5">
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-pink-50" />
              <span className="text-tiny text-sv">50</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-pink-100" />
              <span className="text-tiny text-sv">100</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-pink-200" />
              <span className="text-tiny text-sv">200</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-pink-300" />
              <span className="text-tiny text-sv">300</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-pink-400" />
              <span className="text-tiny text-sv">400</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-pink-500" />
              <span className="text-tiny text-sv">500</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-pink-600" />
              <span className="text-tiny text-sv">600</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-pink-700" />
              <span className="text-tiny text-sv">700</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-pink-800" />
              <span className="text-tiny text-sv">800</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-pink-900" />
              <span className="text-tiny text-sv">900</span>
            </div>
          </div>
        </SubSection>

        {/* ---- Teal ---- */}
        <SubSection title="Teal — #0D9488">
          <div className="grid grid-cols-10 gap-1.5">
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-teal-50" />
              <span className="text-tiny text-sv">50</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-teal-100" />
              <span className="text-tiny text-sv">100</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-teal-200" />
              <span className="text-tiny text-sv">200</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-teal-300" />
              <span className="text-tiny text-sv">300</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-teal-400" />
              <span className="text-tiny text-sv">400</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-teal-500" />
              <span className="text-tiny text-sv">500</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-teal-600" />
              <span className="text-tiny text-sv">600</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-teal-700" />
              <span className="text-tiny text-sv">700</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-teal-800" />
              <span className="text-tiny text-sv">800</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-teal-900" />
              <span className="text-tiny text-sv">900</span>
            </div>
          </div>
        </SubSection>

        {/* ---- Indigo ---- */}
        <SubSection title="Indigo — #4F46E5">
          <div className="grid grid-cols-10 gap-1.5">
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-indigo-50" />
              <span className="text-tiny text-sv">50</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-indigo-100" />
              <span className="text-tiny text-sv">100</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-indigo-200" />
              <span className="text-tiny text-sv">200</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-indigo-300" />
              <span className="text-tiny text-sv">300</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-indigo-400" />
              <span className="text-tiny text-sv">400</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-indigo-500" />
              <span className="text-tiny text-sv">500</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-indigo-600" />
              <span className="text-tiny text-sv">600</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-indigo-700" />
              <span className="text-tiny text-sv">700</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-indigo-800" />
              <span className="text-tiny text-sv">800</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-indigo-900" />
              <span className="text-tiny text-sv">900</span>
            </div>
          </div>
        </SubSection>

        {/* ---- Lime ---- */}
        <SubSection title="Lime — #65A30D">
          <div className="grid grid-cols-10 gap-1.5">
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-lime-50" />
              <span className="text-tiny text-sv">50</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-lime-100" />
              <span className="text-tiny text-sv">100</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-lime-200" />
              <span className="text-tiny text-sv">200</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-lime-300" />
              <span className="text-tiny text-sv">300</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-lime-400" />
              <span className="text-tiny text-sv">400</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-lime-500" />
              <span className="text-tiny text-sv">500</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-lime-600" />
              <span className="text-tiny text-sv">600</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-lime-700" />
              <span className="text-tiny text-sv">700</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-lime-800" />
              <span className="text-tiny text-sv">800</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-lime-900" />
              <span className="text-tiny text-sv">900</span>
            </div>
          </div>
        </SubSection>

        {/* ---- Slate ---- */}
        <SubSection title="Slate (Neutral Scale)">
          <div className="grid grid-cols-10 gap-1.5">
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md border bg-slate-50" />
              <span className="text-tiny text-sv">50</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-slate-100" />
              <span className="text-tiny text-sv">100</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-slate-200" />
              <span className="text-tiny text-sv">200</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-slate-300" />
              <span className="text-tiny text-sv">300</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-slate-400" />
              <span className="text-tiny text-sv">400</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-slate-500" />
              <span className="text-tiny text-sv">500</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-slate-600" />
              <span className="text-tiny text-sv">600</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-slate-700" />
              <span className="text-tiny text-sv">700</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-slate-800" />
              <span className="text-tiny text-sv">800</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-slate-900" />
              <span className="text-tiny text-sv">900</span>
            </div>
          </div>
        </SubSection>

        {/* ---- Project Neutrals ---- */}
        <SubSection title="Project Neutrals">
          <div className="grid grid-cols-7 gap-2">
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-DG" />
              <span className="text-tiny text-sv">DG</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-MG" />
              <span className="text-tiny text-sv">MG</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-sv" />
              <span className="text-tiny text-sv">sv</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md bg-bordercolor" />
              <span className="text-tiny text-sv">border</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md border bg-LG" />
              <span className="text-tiny text-sv">LG</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md border bg-BG" />
              <span className="text-tiny text-sv">BG</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-full rounded-md border bg-white" />
              <span className="text-tiny text-sv">white</span>
            </div>
          </div>
        </SubSection>

        <SubSection title="Semantic Colors (CSS Variables)">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
            <div className="flex flex-col items-center gap-1">
              <div className="h-16 w-full rounded-lg bg-primary" />
              <span className="text-caption text-DG">primary</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-16 w-full rounded-lg bg-primary-foreground border" />
              <span className="text-caption text-DG">primary-fg</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-16 w-full rounded-lg bg-secondary" />
              <span className="text-caption text-DG">secondary</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-16 w-full rounded-lg bg-muted" />
              <span className="text-caption text-DG">muted</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-16 w-full rounded-lg bg-accent" />
              <span className="text-caption text-DG">accent</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-16 w-full rounded-lg bg-destructive" />
              <span className="text-caption text-DG">destructive</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-16 w-full rounded-lg border bg-background" />
              <span className="text-caption text-DG">background</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-16 w-full rounded-lg bg-foreground" />
              <span className="text-caption text-DG">foreground</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-16 w-full rounded-lg border bg-card" />
              <span className="text-caption text-DG">card</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-16 w-full rounded-lg border bg-popover" />
              <span className="text-caption text-DG">popover</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-16 w-full rounded-lg bg-border" />
              <span className="text-caption text-DG">border</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-16 w-full rounded-lg bg-ring" />
              <span className="text-caption text-DG">ring</span>
            </div>
          </div>
        </SubSection>

        <Separator className="my-8" />

        {/* ========== TYPOGRAPHY ========== */}
        <SectionTitle>Typography (타이포그래피)</SectionTitle>

        <SubSection title="Font Sizes">
          <div className="space-y-4 rounded-lg border bg-white p-6">
            <div className="flex items-baseline gap-4">
              <span className="w-28 shrink-0 text-caption text-sv">display 28px/800</span>
              <p className="text-display">Display - 대형 타이틀</p>
            </div>
            <Separator />
            <div className="flex items-baseline gap-4">
              <span className="w-28 shrink-0 text-caption text-sv">heading1 22px/700</span>
              <p className="text-heading1">Heading 1 - 타이틀 텍스트</p>
            </div>
            <Separator />
            <div className="flex items-baseline gap-4">
              <span className="w-28 shrink-0 text-caption text-sv">heading2 21px/600</span>
              <p className="text-heading2">Heading 2 - 서브 타이틀</p>
            </div>
            <Separator />
            <div className="flex items-baseline gap-4">
              <span className="w-28 shrink-0 text-caption text-sv">heading3 18px/600</span>
              <p className="text-heading3">Heading 3 - 섹션 타이틀</p>
            </div>
            <Separator />
            <div className="flex items-baseline gap-4">
              <span className="w-28 shrink-0 text-caption text-sv">heading4 16px/600</span>
              <p className="text-heading4">Heading 4 - 소제목 텍스트</p>
            </div>
            <Separator />
            <div className="flex items-baseline gap-4">
              <span className="w-28 shrink-0 text-caption text-sv">bodylarge 16px/400</span>
              <p className="text-bodylarge">
                Body Large - 본문 큰 텍스트입니다. 넓은 행간으로 가독성이 좋습니다.
              </p>
            </div>
            <Separator />
            <div className="flex items-baseline gap-4">
              <span className="w-28 shrink-0 text-caption text-sv">bodymedium 15px/400</span>
              <p className="text-bodymedium">
                Body Medium - 기본 본문 텍스트입니다. 대부분의 콘텐츠에 사용됩니다.
              </p>
            </div>
            <Separator />
            <div className="flex items-baseline gap-4">
              <span className="w-28 shrink-0 text-caption text-sv">bodybtn 15px/500</span>
              <p className="text-bodybtn">Body Button - 버튼 텍스트 스타일</p>
            </div>
            <Separator />
            <div className="flex items-baseline gap-4">
              <span className="w-28 shrink-0 text-caption text-sv">caption2 14px/400</span>
              <p className="text-caption2">Caption 2 - 보조 텍스트, 설명문구에 사용됩니다.</p>
            </div>
            <Separator />
            <div className="flex items-baseline gap-4">
              <span className="w-28 shrink-0 text-caption text-sv">caption 13px/400</span>
              <p className="text-caption">
                Caption - 가장 작은 텍스트, 주석이나 메타 정보에 사용됩니다.
              </p>
            </div>
            <Separator />
            <div className="flex items-baseline gap-4">
              <span className="w-28 shrink-0 text-caption text-sv">tiny 11px/400</span>
              <p className="text-tiny">Tiny - 매우 작은 텍스트, 라벨이나 보조 정보</p>
            </div>
          </div>
        </SubSection>

        <SubSection title="Font Colors">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            <span className="text-bodylarge text-foreground">foreground</span>
            <span className="text-bodylarge text-DG">DG #3D3D3D</span>
            <span className="text-bodylarge text-sv">sv #949494</span>
            <span className="text-bodylarge text-muted-foreground">muted-foreground</span>
            <span className="text-bodylarge text-rd">rd #EB1700</span>
            <span className="text-bodylarge text-blue">blue #1475F8</span>
            <span className="text-bodylarge text-green">green #009E03</span>
            <span className="text-bodylarge text-yellow">yellow #F57F17</span>
            <span className="text-bodylarge text-primary">primary</span>
            <span className="text-bodylarge text-destructive">destructive</span>
          </div>
        </SubSection>

        <Separator className="my-8" />

        {/* ========== BUTTONS ========== */}
        <SectionTitle>Buttons (버튼)</SectionTitle>

        <SubSection title="Base Variants">
          <div className="flex flex-wrap gap-3">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
        </SubSection>

        <SubSection title="Solid Color Variants">
          <div className="flex flex-wrap gap-3">
            <Button variant="rd">Red</Button>
            <Button variant="blue">Blue</Button>
            <Button variant="green">Green</Button>
            <Button variant="yellow">Yellow</Button>
            <Button variant="purple">Purple</Button>
            <Button variant="pink">Pink</Button>
            <Button variant="teal">Teal</Button>
            <Button variant="indigo">Indigo</Button>
          </div>
        </SubSection>

        <SubSection title="Outline Color Variants">
          <div className="flex flex-wrap gap-3">
            <Button variant="rd-outline">Red</Button>
            <Button variant="blue-outline">Blue</Button>
            <Button variant="green-outline">Green</Button>
            <Button variant="yellow-outline">Yellow</Button>
            <Button variant="purple-outline">Purple</Button>
            <Button variant="pink-outline">Pink</Button>
            <Button variant="teal-outline">Teal</Button>
            <Button variant="indigo-outline">Indigo</Button>
          </div>
        </SubSection>

        <SubSection title="Ghost Color Variants">
          <div className="flex flex-wrap gap-3">
            <Button variant="rd-ghost">Red</Button>
            <Button variant="blue-ghost">Blue</Button>
            <Button variant="green-ghost">Green</Button>
            <Button variant="yellow-ghost">Yellow</Button>
            <Button variant="purple-ghost">Purple</Button>
          </div>
        </SubSection>

        <SubSection title="Sizes">
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </SubSection>

        <SubSection title="With Icons">
          <div className="flex flex-wrap gap-3">
            <Button variant="blue">
              <Plus /> 새 프로젝트
            </Button>
            <Button variant="rd">
              <Trash2 /> 삭제
            </Button>
            <Button variant="outline">
              <Search /> 검색
            </Button>
            <Button variant="green">
              <CircleCheck /> 승인
            </Button>
            <Button variant="yellow-outline">
              <Edit3 /> 수정
            </Button>
            <Button variant="ghost">
              <Copy /> 복사
            </Button>
          </div>
        </SubSection>

        <SubSection title="Disabled">
          <div className="flex flex-wrap gap-3">
            <Button disabled>Disabled</Button>
            <Button disabled variant="rd">
              Disabled Red
            </Button>
            <Button disabled variant="outline">
              Disabled Outline
            </Button>
          </div>
        </SubSection>

        <Separator className="my-8" />

        {/* ========== BADGES ========== */}
        <SectionTitle>Badges (뱃지)</SectionTitle>

        <SubSection title="Base Variants">
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </SubSection>

        <SubSection title="Soft Color Variants">
          <div className="flex flex-wrap gap-2">
            <Badge variant="rd">Red</Badge>
            <Badge variant="blue">Blue</Badge>
            <Badge variant="green">Green</Badge>
            <Badge variant="yellow">Yellow</Badge>
            <Badge variant="purple">Purple</Badge>
            <Badge variant="pink">Pink</Badge>
            <Badge variant="teal">Teal</Badge>
            <Badge variant="indigo">Indigo</Badge>
            <Badge variant="lime">Lime</Badge>
          </div>
        </SubSection>

        <SubSection title="Solid Color Variants">
          <div className="flex flex-wrap gap-2">
            <Badge variant="rd-solid">Red</Badge>
            <Badge variant="blue-solid">Blue</Badge>
            <Badge variant="green-solid">Green</Badge>
            <Badge variant="yellow-solid">Yellow</Badge>
            <Badge variant="purple-solid">Purple</Badge>
            <Badge variant="pink-solid">Pink</Badge>
            <Badge variant="teal-solid">Teal</Badge>
            <Badge variant="indigo-solid">Indigo</Badge>
          </div>
        </SubSection>

        <SubSection title="Role Badges">
          <div className="flex flex-wrap gap-2">
            <Badge variant="owner">
              <Shield className="mr-1 h-3 w-3" /> Owner
            </Badge>
            <Badge variant="developer">
              <Key className="mr-1 h-3 w-3" /> Developer
            </Badge>
            <Badge variant="viewer">
              <Eye className="mr-1 h-3 w-3" /> Viewer
            </Badge>
          </div>
        </SubSection>

        <SubSection title="Status Badges">
          <div className="flex flex-wrap gap-2">
            <Badge variant="active">Active</Badge>
            <Badge variant="pending">Pending</Badge>
            <Badge variant="expired">Expired</Badge>
            <Badge variant="rejected">Rejected</Badge>
            <Badge variant="inactive">Inactive</Badge>
          </div>
        </SubSection>

        <Separator className="my-8" />

        {/* ========== ALERTS ========== */}
        <SectionTitle>Alerts (알림)</SectionTitle>

        <div className="space-y-3">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>기본 알림</AlertTitle>
            <AlertDescription>기본 스타일의 알림 메시지입니다.</AlertDescription>
          </Alert>
          <Alert variant="info">
            <Info className="h-4 w-4" />
            <AlertTitle>정보</AlertTitle>
            <AlertDescription>새로운 업데이트가 있습니다. 확인해보세요.</AlertDescription>
          </Alert>
          <Alert variant="success">
            <CircleCheck className="h-4 w-4" />
            <AlertTitle>성공</AlertTitle>
            <AlertDescription>조직이 성공적으로 생성되었습니다.</AlertDescription>
          </Alert>
          <Alert variant="warning">
            <TriangleAlert className="h-4 w-4" />
            <AlertTitle>경고</AlertTitle>
            <AlertDescription>초대장이 3일 후 만료됩니다.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <CircleAlert className="h-4 w-4" />
            <AlertTitle>오류</AlertTitle>
            <AlertDescription>프로젝트 삭제에 실패했습니다. 다시 시도해주세요.</AlertDescription>
          </Alert>
          <Alert variant="rd">
            <CircleAlert className="h-4 w-4" />
            <AlertTitle>중요</AlertTitle>
            <AlertDescription>API 키가 노출되었을 수 있습니다. 즉시 재발급하세요.</AlertDescription>
          </Alert>
        </div>

        <Separator className="my-8" />

        {/* ========== FORM COMPONENTS ========== */}
        <SectionTitle>Form Components (폼)</SectionTitle>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Input & Label</CardTitle>
              <CardDescription>텍스트 입력 필드</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input id="email" placeholder="example@email.com" type="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input id="password" placeholder="비밀번호를 입력하세요" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="search">검색</Label>
                <Input disabled id="search" placeholder="비활성화 상태" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Textarea & Select</CardTitle>
              <CardDescription>다줄 입력 및 선택 필드</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="desc">설명</Label>
                <Textarea id="desc" placeholder="프로젝트에 대한 설명을 입력하세요..." />
              </div>
              <div className="space-y-2">
                <Label>역할 선택</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="역할을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="developer">Developer</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Checkbox & Switch</CardTitle>
              <CardDescription>체크박스와 스위치</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="terms" />
                <Label htmlFor="terms">이용약관에 동의합니다</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox defaultChecked id="privacy" />
                <Label htmlFor="privacy">개인정보 처리방침에 동의합니다</Label>
              </div>
              <Separator />
              <div className="flex items-center space-x-2">
                <Switch checked={switchValue} id="notifications" onCheckedChange={setSwitchValue} />
                <Label htmlFor="notifications">알림 {switchValue ? "ON" : "OFF"}</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>로그인 폼 예시</CardTitle>
              <CardDescription>실제 로그인 화면 형태</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">이메일</Label>
                <Input id="login-email" placeholder="이메일을 입력하세요" type="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-pw">비밀번호</Label>
                <Input id="login-pw" placeholder="비밀번호를 입력하세요" type="password" />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
                <Label className="text-caption" htmlFor="remember">
                  로그인 상태 유지
                </Label>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button className="w-full" variant="default">
                로그인
              </Button>
              <Button className="w-full" variant="outline">
                회원가입
              </Button>
            </CardFooter>
          </Card>
        </div>

        <Separator className="my-8" />

        {/* ========== CARDS ========== */}
        <SectionTitle>Cards (카드)</SectionTitle>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue" />
                <CardTitle>컨시언스파트너스</CardTitle>
              </div>
              <CardDescription>조직 관리 카드</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Badge variant="owner">Owner</Badge>
                <Badge variant="active">Active</Badge>
              </div>
              <p className="mt-3 text-bodymedium">멤버 12명 · 프로젝트 5개</p>
            </CardContent>
            <CardFooter className="gap-2">
              <Button size="sm" variant="blue-outline">
                관리
              </Button>
              <Button size="sm" variant="ghost">
                설정
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-green" />
                <CardTitle>API 서버</CardTitle>
              </div>
              <CardDescription>프로젝트 카드</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Badge variant="developer">Developer</Badge>
                <Badge variant="active">Active</Badge>
              </div>
              <p className="mt-3 text-bodymedium">API 키 3개 · 멤버 8명</p>
            </CardContent>
            <CardFooter className="gap-2">
              <Button size="sm" variant="green-outline">
                열기
              </Button>
              <Button size="sm" variant="ghost">
                설정
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-yellow" />
                <CardTitle>멤버 초대</CardTitle>
              </div>
              <CardDescription>초대 상태 카드</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Badge variant="pending">Pending</Badge>
              </div>
              <p className="mt-3 text-bodymedium">user@example.com 초대 대기중</p>
              <p className="mt-1 text-caption text-sv">3일 후 만료</p>
            </CardContent>
            <CardFooter className="gap-2">
              <Button size="sm" variant="yellow-outline">
                재전송
              </Button>
              <Button size="sm" variant="ghost">
                취소
              </Button>
            </CardFooter>
          </Card>
        </div>

        <Separator className="my-8" />

        {/* ========== AVATAR ========== */}
        <SectionTitle>Avatars (아바타)</SectionTitle>

        <div className="flex flex-wrap items-center gap-4">
          <Avatar>
            <AvatarFallback className="bg-blue-8 text-blue">JK</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback className="bg-rd-8 text-rd">AD</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback className="bg-green-8 text-green">YH</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback className="bg-yellow-8 text-yellow">SM</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>UN</AvatarFallback>
          </Avatar>
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary text-primary-foreground text-heading4">
              CP
            </AvatarFallback>
          </Avatar>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-secondary text-caption">S</AvatarFallback>
          </Avatar>
        </div>

        <Separator className="my-8" />

        {/* ========== TABLE ========== */}
        <SectionTitle>Table (테이블)</SectionTitle>

        <Card>
          <CardHeader>
            <CardTitle>조직 멤버 목록</CardTitle>
            <CardDescription>멤버의 역할과 상태를 관리합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>멤버</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>역할</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-rd-8 text-caption text-rd">JK</AvatarFallback>
                      </Avatar>
                      김정국
                    </div>
                  </TableCell>
                  <TableCell className="text-bodymedium">jk@example.com</TableCell>
                  <TableCell>
                    <Badge variant="owner">Owner</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="active">Active</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-8 text-caption text-blue">
                          LH
                        </AvatarFallback>
                      </Avatar>
                      이현수
                    </div>
                  </TableCell>
                  <TableCell className="text-bodymedium">hs@example.com</TableCell>
                  <TableCell>
                    <Badge variant="developer">Developer</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="active">Active</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-green-8 text-caption text-green">
                          PY
                        </AvatarFallback>
                      </Avatar>
                      박영희
                    </div>
                  </TableCell>
                  <TableCell className="text-bodymedium">yh@example.com</TableCell>
                  <TableCell>
                    <Badge variant="viewer">Viewer</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="active">Active</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-yellow-8 text-caption text-yellow">
                          CS
                        </AvatarFallback>
                      </Avatar>
                      최서연
                    </div>
                  </TableCell>
                  <TableCell className="text-bodymedium">sy@example.com</TableCell>
                  <TableCell>
                    <Badge variant="developer">Developer</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="pending">Pending</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
              <TableCaption>총 4명의 멤버</TableCaption>
            </Table>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        {/* ========== TABS ========== */}
        <SectionTitle>Tabs (탭)</SectionTitle>

        <Tabs className="w-full" defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="members">멤버</TabsTrigger>
            <TabsTrigger value="settings">설정</TabsTrigger>
            <TabsTrigger value="api-keys">API 키</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>프로젝트 개요</CardTitle>
                <CardDescription>프로젝트의 전반적인 상태를 확인합니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg border bg-blue-4 p-4 text-center">
                    <p className="text-heading1 text-blue">12</p>
                    <p className="text-caption text-sv">API Calls Today</p>
                  </div>
                  <div className="rounded-lg border bg-green-8 p-4 text-center">
                    <p className="text-heading1 text-green">98%</p>
                    <p className="text-caption text-sv">Success Rate</p>
                  </div>
                  <div className="rounded-lg border bg-yellow-8 p-4 text-center">
                    <p className="text-heading1 text-yellow">3</p>
                    <p className="text-caption text-sv">Active Keys</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle>멤버 관리</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-bodymedium">멤버를 추가하고 역할을 관리합니다.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>프로젝트 설정</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-bodymedium">프로젝트 이름, 설명 등을 수정합니다.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="api-keys">
            <Card>
              <CardHeader>
                <CardTitle>API 키 관리</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-bodymedium">API 키를 생성하고 관리합니다.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Separator className="my-8" />

        {/* ========== DIALOGS ========== */}
        <SectionTitle>Dialogs & Overlays (다이얼로그)</SectionTitle>

        <div className="flex flex-wrap gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="blue">
                <Plus /> 멤버 초대
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>멤버 초대</DialogTitle>
                <DialogDescription>이메일로 조직에 멤버를 초대합니다.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">이메일</Label>
                  <Input id="invite-email" placeholder="user@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>역할</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="역할 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="developer">Developer</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline">취소</Button>
                <Button variant="blue">초대하기</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 /> 프로젝트 삭제
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>프로젝트를 삭제하시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription>
                  이 작업은 되돌릴 수 없습니다. 프로젝트와 관련된 모든 데이터가 영구적으로
                  삭제됩니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Settings /> 메뉴 <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>내 계정</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" /> 프로필
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" /> 설정
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Key className="mr-2 h-4 w-4" /> API 키
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-rd">
                <LogOut className="mr-2 h-4 w-4" /> 로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Tooltip Hover</Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>이것은 툴팁입니다</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Separator className="my-8" />

        {/* ========== SKELETON ========== */}
        <SectionTitle>Skeleton (로딩)</SectionTitle>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>로딩 상태</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-3 w-[150px]" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[80%]" />
              <Skeleton className="h-10 w-[120px]" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[180px]" />
              <Skeleton className="h-4 w-[240px]" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8" />

        <div className="pb-10 text-center">
          <p className="text-caption text-sv">
            shadcn/ui Component Library · Built with Radix UI + Tailwind CSS + CVA
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
}
