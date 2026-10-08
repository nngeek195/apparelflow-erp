'use client';


interface NewRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void | Promise<void>;
}

export default function NewRecipeModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  if (!isOpen) return null;
  return <div className="fixed inset-0 bg-black/50"><div className="bg-white p-4">New Recipe Modal <button onClick={onClose}>Close</button></div></div>;
}