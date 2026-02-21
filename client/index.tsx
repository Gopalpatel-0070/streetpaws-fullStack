import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  Heart,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  Sparkles,
  X,
  PawPrint,
  Send,
  CheckCircle2,
  Pencil,
  Trash2,
  Image as ImageIcon,
  User,
  Phone,
  Moon,
  Sun,
  Grid,
  List,
  Download,
  Share2,
  LogOut,
  AlertCircle,
  Loader,
  Printer,
} from "lucide-react";
import { LoginPage } from "./LoginPage";
import apiService from "./apiService";

// --- Types & Constants ---
type PetType = "Dog" | "Cat" | "Bird" | "Rat" | "Other";
type SortOption = "Newest" | "Oldest" | "Name" | "Urgency";
type FilterType = PetType | "All" | "Favorites" | "Urgent" | "Recommended";
type ViewMode = "grid" | "list";
type UrgencyLevel = "Low" | "Medium" | "High" | "Critical";
type PetStatus = "Available" | "Adopted" | "Fostered";

const EMOTIONAL_QUOTES = [
  "Every life matters.",
  "Be the voice for those who cannot speak.",
  "Love is a four-legged word.",
  "Saving one animal changes the world for them.",
  "Adoption is an act of pure love.",
  "Kindness starts with a big heart.",
  "Compassion is the heart of every home."
];

interface Comment {
  id: string;
  text: string;
  createdAt: Date;
  author: string;
}

interface Pet {
  id: string;
  name: string;
  type: PetType;
  age: string;
  location: string;
  distance: number;
  description: string;
  imageUrl: string;
  contactNumber: string;
  contactName: string;
  postedAt: Date;
  urgency: UrgencyLevel;
  status: PetStatus;
  traits: string;
  comments: Comment[];
  cheers: number;
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

// --- Mock Data ---
const INITIAL_PETS: Pet[] = [
  {
    id: "1",
    name: "Rusty",
    type: "Dog",
    age: "2 years",
    location: "Downtown Market Area",
    distance: 1.2,
    description: "Rusty is a gentle soul who loves watching people pass by. He's a bit shy at first but wags his tail furiously once he knows you have a biscuit. Needs a safe home.",
    imageUrl: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=800",
    contactNumber: "15550001234",
    contactName: "Market Keeper",
    postedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    urgency: "Medium",
    status: "Available",
    traits: "gentle, shy, food-motivated, chill",
    comments: [],
    cheers: 5,
  },
  {
    id: "2",
    name: "Luna",
    type: "Cat",
    age: "6 months",
    location: "Greenwood Park Entrance",
    distance: 3.5,
    description: "Found this little energetic kitten near the park benches. She is fearless, playful, and loves chasing leaves. Very clean and healthy.",
    imageUrl: "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?auto=format&fit=crop&q=80&w=800",
    contactNumber: "15550005678",
    contactName: "Sarah J.",
    postedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    urgency: "Low",
    status: "Adopted",
    traits: "playful, energetic, clean, active",
    comments: [{ id: "c1", text: "So happy she found a home!", author: "Neighbor", createdAt: new Date() }],
    cheers: 24,
  },
];

// --- Helpers ---
const normalizePet = (p: Partial<Pet>): Pet => ({
  id: p.id || Math.random().toString(36).substring(2, 9),
  name: p.name || "",
  type: p.type || "Other",
  age: p.age || "",
  location: p.location || "",
  distance: p.distance || 0,
  description: p.description || "",
  imageUrl: p.imageUrl || "",
  contactNumber: p.contactNumber || "",
  contactName: p.contactName || "Anonymous",
  postedAt: p.postedAt ? new Date(p.postedAt) : new Date(),
  urgency: p.urgency || "Medium",
  status: p.status || "Available",
  traits: p.traits || "",
  comments: p.comments || [],
  cheers: p.cheers || 0,
});

const urgencyScore = (u: UrgencyLevel) => {
  switch (u) {
    case "Critical": return 4;
    case "High": return 3;
    case "Medium": return 2;
    case "Low": return 1;
    default: return 0;
  }
};

// --- Main App Component ---

function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // App state
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoadingPets, setIsLoadingPets] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecModalOpen, setIsRecModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [selectedType, setSelectedType] = useState<FilterType>("All");
  const [recommendedPetIds, setRecommendedPetIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("Newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [darkMode, setDarkMode] = useState(false);
  const [posterPet, setPosterPet] = useState<Pet | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const token = apiService.getToken();
      if (token) {
        try {
          const response = await apiService.getCurrentUser();
          setCurrentUser(response.data);
        } catch (err) {
          console.error("Auth check failed:", err);
          apiService.clearToken();
        }
      }
      setIsAuthLoading(false);
    };

    checkAuth();
  }, []);

  // Fetch pets from backend
  useEffect(() => {
    if (!currentUser) return;

    const fetchPets = async () => {
      setIsLoadingPets(true);
      try {
        const response = await apiService.getPets({
          search: searchTerm,
          type: selectedType !== "All" ? selectedType : undefined,
          sort: sortBy === "Newest" ? "-createdAt" : sortBy === "Oldest" ? "createdAt" : undefined,
          page: 1,
          limit: 50,
        });

        const normalizedPets = response.data.map((p: any) => ({
          id: p._id,
          name: p.name,
          type: p.type,
          age: p.age,
          location: p.location,
          distance: p.distance,
          description: p.description,
          imageUrl: p.imageUrl,
          contactNumber: p.contactNumber,
          contactName: p.contactName,
          postedAt: new Date(p.createdAt),
          urgency: p.urgency,
          status: p.status,
          traits: p.traits,
          comments: p.comments,
          cheers: p.cheers?.length || 0,
        }));

        setPets(normalizedPets);
      } catch (err) {
        console.error("Failed to fetch pets:", err);
        addToast("Failed to load pets", "error");
      } finally {
        setIsLoadingPets(false);
      }
    };

    fetchPets();
  }, [currentUser, searchTerm, selectedType, sortBy]);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % EMOTIONAL_QUOTES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isModalOpen || isRecModalOpen || posterPet) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isModalOpen, isRecModalOpen, posterPet]);



  const addToast = (message: string, type: Toast["type"] = "info") => {
    const id = Math.random().toString(36);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };

  const handleLoginSuccess = (user: any, token: string) => {
    setCurrentUser(user);
    addToast(`Welcome, ${user.username}!`, "success");
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
      setCurrentUser(null);
      setPets([]);
      addToast("Logged out successfully", "success");
    } catch (err) {
      addToast("Failed to logout", "error");
    }
  };

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("streetpaws_favorites");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const toggleFavorite = (petId: string) => {
    setFavorites((prev) => {
      const isFav = prev.includes(petId);
      const newFavs = isFav ? prev.filter(id => id !== petId) : [...prev, petId];
      localStorage.setItem("streetpaws_favorites", JSON.stringify(newFavs));
      addToast(isFav ? "Removed from favorites" : "Added to favorites", "success");
      return newFavs;
    });
  };

  const handleAddComment = async (petId: string, text: string) => {
    try {
      await apiService.addComment(petId, text);
      
      // Refresh the pet data
      const petResponse = await apiService.getPetById(petId);
      const p = petResponse.data;
      const updatedPet = {
        id: p._id,
        name: p.name,
        type: p.type,
        age: p.age,
        location: p.location,
        distance: p.distance,
        description: p.description,
        imageUrl: p.imageUrl,
        contactNumber: p.contactNumber,
        contactName: p.contactName,
        postedAt: new Date(p.createdAt),
        urgency: p.urgency,
        status: p.status,
        traits: p.traits,
        comments: p.comments,
        cheers: p.cheers?.length || 0,
      };

      const updatedPets = pets.map(pet => pet.id === petId ? updatedPet : pet);
      setPets(updatedPets);
      addToast("Comment added!", "success");
    } catch (err: any) {
      addToast(err.message || "Failed to add comment", "error");
    }
  };

  const handleCheer = async (petId: string) => {
    try {
      await apiService.toggleCheer(petId);
      
      // Refresh the pet data
      const petResponse = await apiService.getPetById(petId);
      const p = petResponse.data;
      const updatedPet = {
        id: p._id,
        name: p.name,
        type: p.type,
        age: p.age,
        location: p.location,
        distance: p.distance,
        description: p.description,
        imageUrl: p.imageUrl,
        contactNumber: p.contactNumber,
        contactName: p.contactName,
        postedAt: new Date(p.createdAt),
        urgency: p.urgency,
        status: p.status,
        traits: p.traits,
        comments: p.comments,
        cheers: p.cheers?.length || 0,
      };

      const updatedPets = pets.map(pet => pet.id === petId ? updatedPet : pet);
      setPets(updatedPets);
    } catch (err: any) {
      addToast(err.message || "Failed to cheer", "error");
    }
  };

  const handleStatusChange = async (petId: string, status: PetStatus) => {
    try {
      await apiService.updatePet(petId, { status });
      const updatedPets = pets.map(p => p.id === petId ? { ...p, status } : p);
      setPets(updatedPets);
      addToast(`Status updated to ${status}`, "success");
    } catch (err: any) {
      addToast(err.message || "Failed to update status", "error");
    }
  };

  const handleDeletePet = async (petId: string) => {
    if (confirm("Are you sure you want to delete this listing?")) {
      try {
        await apiService.deletePet(petId);
        const updatedPets = pets.filter(p => p.id !== petId);
        setPets(updatedPets);
        addToast("Listing deleted.", "info");
      } catch (err: any) {
        addToast(err.message || "Failed to delete pet", "error");
      }
    }
  };

  const handleSavePet = async (petData: Pet) => {
    try {
      const petPayload = {
        name: petData.name,
        type: petData.type,
        age: petData.age,
        location: petData.location,
        description: petData.description,
        contactNumber: petData.contactNumber,
        contactName: petData.contactName,
        urgency: petData.urgency,
        traits: petData.traits,
        imageUrl: petData.imageUrl,
      };

      if (editingPet) {
        await apiService.updatePet(editingPet.id, petPayload);
        addToast("Pet details updated!", "success");
      } else {
        await apiService.createPet(petPayload);
        addToast("Pet listed successfully!", "success");
      }

      // Refresh pets list
      const response = await apiService.getPets();
      const normalizedPets = response.data.map((p: any) => ({
        id: p._id,
        name: p.name,
        type: p.type,
        age: p.age,
        location: p.location,
        distance: p.distance,
        description: p.description,
        imageUrl: p.imageUrl,
        contactNumber: p.contactNumber,
        contactName: p.contactName,
        postedAt: new Date(p.createdAt),
        urgency: p.urgency,
        status: p.status,
        traits: p.traits,
        comments: p.comments,
        cheers: p.cheers?.length || 0,
      }));
      setPets(normalizedPets);

      setIsModalOpen(false);
      setEditingPet(null);
    } catch (err: any) {
      addToast(err.message || "Failed to save pet", "error");
    }
  };

  const filteredPets = pets.filter((pet) => {
    if (selectedType === "Recommended") return recommendedPetIds.includes(pet.id);
    const matchesType = selectedType === "All" || (selectedType === "Favorites" && favorites.includes(pet.id)) || (selectedType === "Urgent" && (pet.urgency === "High" || pet.urgency === "Critical")) || pet.type === selectedType;
    return matchesType && (pet.name.toLowerCase().includes(searchTerm.toLowerCase()) || pet.location.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const sortedPets = [...filteredPets].sort((a, b) => {
    if (a.status === "Adopted" && b.status !== "Adopted") return 1;
    if (b.status === "Adopted" && a.status !== "Adopted") return -1;
    if (sortBy === "Newest") return b.postedAt.getTime() - a.postedAt.getTime();
    if (sortBy === "Urgency") return urgencyScore(b.urgency) - urgencyScore(a.urgency);
    if (sortBy === "Name") return a.name.localeCompare(b.name);
    return 0;
  });

  // Show loading screen while checking auth
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} className="animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-stone-600">Loading StreetPaws...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? "bg-stone-900 text-stone-100" : "bg-stone-50 text-stone-800"}`}>
      
      {/* Toasts */}
      <div className="fixed top-20 right-4 z-[100] space-y-2 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className={`pointer-events-auto px-4 py-3 rounded-3xl shadow-xl flex items-center gap-2 animate-in slide-in-from-right-10 ${toast.type === "success" ? "bg-green-600 text-white" : "bg-stone-800 text-white"}`}>
            {toast.type === "success" && <CheckCircle2 size={16} />}
            <span className="text-sm font-semibold">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <header className={`border-b shadow-sm transition-colors sticky top-0 z-40 px-4 h-16 flex items-center justify-between no-print ${darkMode ? "bg-stone-900 border-stone-800" : "bg-white border-stone-200"}`}>
        <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white transition-transform group-hover:scale-110">
            <PawPrint size={22} />
          </div>
          <h1 className="text-xl font-black tracking-tight">
            Street<span className="text-amber-500">Paws</span>
          </h1>
        </button>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-full transition-colors ${darkMode ? "bg-stone-800 text-amber-400" : "bg-stone-100 text-stone-600"}`}>
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div className={`px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 ${darkMode ? "bg-stone-800 text-stone-300" : "bg-stone-100 text-stone-600"}`}>
            <User size={16} />
            <span className="hidden sm:inline">{currentUser.username}</span>
          </div>
          <button onClick={() => {setEditingPet(null); setIsModalOpen(true);}} className="bg-amber-600 text-white px-5 py-2.5 rounded-3xl font-bold text-sm hover:bg-amber-700 transition-all flex items-center gap-2 shadow-lg active:scale-95">
            <Plus size={18} />
            <span className="hidden xs:inline">List stray</span>
          </button>
          <button onClick={handleLogout} className={`p-2.5 rounded-full transition-colors ${darkMode ? "bg-stone-800 text-red-400 hover:bg-stone-700" : "bg-stone-100 text-red-600 hover:bg-stone-200"}`} title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className={`py-12 sm:py-20 px-4 text-center relative overflow-hidden transition-colors no-print ${darkMode ? "bg-stone-800/30" : "bg-amber-50"}`}>
        <div className="max-w-4xl mx-auto relative z-10 space-y-6">
          <div className="h-24 sm:h-32 flex items-center justify-center">
             <h2 key={quoteIndex} className="text-3xl sm:text-5xl md:text-6xl font-black leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
               {EMOTIONAL_QUOTES[quoteIndex].split(' ').map((word, i) => (
                 <span key={i} className={i % 2 === 1 ? "text-amber-500" : ""}>{word} </span>
               ))}
             </h2>
          </div>
          <p className="text-base sm:text-xl opacity-70 max-w-2xl mx-auto italic font-medium">
            "Every paw deserves a story with a happy ending."
          </p>
          <button onClick={() => setIsRecModalOpen(true)} className="bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-900 px-8 py-4 rounded-3xl font-black text-sm sm:text-base shadow-2xl flex items-center gap-2 mx-auto hover:scale-105 transition-all active:scale-95 group">
            <Sparkles size={20} className="group-hover:animate-pulse" /> Find a companion
          </button>
        </div>
      </section>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto px-4 py-8 no-print">
        <div className="flex flex-col gap-6 mb-10">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
            {["All", "Favorites", "Urgent", "Recommended", "Dog", "Cat", "Bird", "Other"].map((type) => (
              <button
                key={type}
                onClick={() => { setSelectedType(type as FilterType); if (type !== 'Recommended') setRecommendedPetIds([]); }}
                className={`px-5 py-2.5 rounded-3xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all border shrink-0 flex items-center gap-2 ${selectedType === type ? "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20" : "bg-white border-stone-200 text-stone-600 hover:border-amber-500/50 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-400"}`}
              >
                {type === "Favorites" && <Heart size={14} className={selectedType === "Favorites" ? "fill-white" : ""} />}
                {type}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input
                type="text"
                placeholder="Search area or animal name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-12 pr-4 py-4 rounded-3xl border transition-all text-sm outline-none font-medium focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 ${darkMode ? "bg-stone-900 border-stone-600 text-white placeholder-stone-600" : "bg-white border-stone-300 text-stone-950 placeholder-stone-400"}`}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className={`flex-1 sm:w-44 px-5 py-4 rounded-3xl border font-bold text-sm outline-none transition-all cursor-pointer ${darkMode ? "bg-stone-900 border-stone-600 text-white" : "bg-white border-stone-300 text-stone-950"}`}
              >
                <option value="Newest">Recent First</option>
                <option value="Urgency">Urgency High</option>
                <option value="Name">Name A-Z</option>
              </select>
              <div className={`hidden xs:flex p-1 rounded-3xl border ${darkMode ? "bg-stone-900 border-stone-600" : "bg-white border-stone-300"}`}>
                <button onClick={() => setViewMode("grid")} className={`p-3 rounded-2xl ${viewMode === "grid" ? "bg-amber-500/10 text-amber-500" : "opacity-40"}`}><Grid size={20} /></button>
                <button onClick={() => setViewMode("list")} className={`p-3 rounded-2xl ${viewMode === "list" ? "bg-amber-500/10 text-amber-500" : "opacity-40"}`}><List size={20} /></button>
              </div>
            </div>
          </div>
        </div>

        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
          {sortedPets.map((pet) => (
            <PetCard
              key={pet.id}
              pet={pet}
              darkMode={darkMode}
              viewMode={viewMode}
              isFavorite={favorites.includes(pet.id)}
              onToggleFavorite={() => toggleFavorite(pet.id)}
              onGeneratePoster={() => setPosterPet(pet)}
              onAddComment={handleAddComment}
              onCheer={handleCheer}
              onStatusChange={handleStatusChange}
              onEdit={() => { setEditingPet(pet); setIsModalOpen(true); }}
              onDelete={() => handleDeletePet(pet.id)}
              addToast={addToast}
            />
          ))}
        </div>
        
        {sortedPets.length === 0 && (
            <div className={`py-32 text-center rounded-[3rem] border-4 border-dashed animate-in fade-in duration-500 ${darkMode ? "border-stone-800 text-stone-600" : "border-stone-200 text-stone-400"}`}>
              <div className="mb-6 flex justify-center"><ImageIcon size={64} className="opacity-20" /></div>
              <p className="text-xl font-black">No matching friends found.</p>
              <p className="text-sm opacity-60 mt-2">Try adjusting your filters or search term.</p>
            </div>
        )}
      </main>

      {/* Footer */}
      <footer className={`mt-20 py-16 border-t transition-colors no-print ${darkMode ? "border-stone-800 bg-stone-900/50" : "border-stone-200 bg-white"}`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-8 text-center">
          <div className="flex items-center gap-2 font-black text-amber-500 text-2xl">
            <PawPrint size={28} /> StreetPaws
          </div>
          <p className="text-base opacity-60 max-w-lg leading-relaxed font-medium">
            Connecting kind hearts with the strays who need them most. Every animal deserves a chance at a warm home.
          </p>
          <div className={`p-8 rounded-[2.5rem] border ${darkMode ? "border-stone-700 bg-stone-800" : "border-amber-500/30 bg-amber-50" } max-w-md w-full shadow-inner`}>
            <p className="text-xs font-black text-amber-600 uppercase tracking-[0.3em] mb-3">Project Credits</p>
            <p className={`text-xl font-black mb-2 ${darkMode ? "text-white" : "text-stone-900"}`}>Developed by Gopal Patel</p>
            <p className="text-xs opacity-60 mb-6 font-medium italic">"Building digital solutions with a human touch."</p>
            <div className="space-y-4">
              <span className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] block">Available for Freelance Projects</span>
              <a href="mailto:patelgopal563@gmail.com" className="inline-block bg-amber-500 text-stone-900 px-8 py-3.5 rounded-3xl text-sm font-black hover:bg-amber-600 transition-all active:scale-95 shadow-lg">patelgopal563@gmail.com</a>
            </div>
          </div>
          <div className="text-[10px] font-bold opacity-30 uppercase tracking-[0.4em]">© 2025 StreetPaws Community</div>
        </div>
      </footer>

      {/* Modals */}
      {isModalOpen && (
        <PetFormModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingPet(null); }}
          onSubmit={handleSavePet}
          darkMode={darkMode}
          initialData={editingPet || undefined}
        />
      )}
      
      {posterPet && (
        <PosterModal 
          pet={posterPet} 
          onClose={() => setPosterPet(null)} 
          darkMode={darkMode} 
        />
      )}

      {isRecModalOpen && (
        <RecommendationModal
          isOpen={isRecModalOpen}
          onClose={() => setIsRecModalOpen(false)}
          pets={pets}
          onRecommend={(ids) => {
            setRecommendedPetIds(ids);
            setSelectedType("Recommended");
            setIsRecModalOpen(false);
          }}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}

// --- Pet Form Modal ---

function PetFormModal({ isOpen, onClose, onSubmit, darkMode, initialData }: { isOpen: boolean, onClose: () => void, onSubmit: (pet: Pet) => void, darkMode: boolean, initialData?: Pet }) {
  const [loadingBio, setLoadingBio] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    type: initialData?.type || ("Dog" as PetType),
    age: initialData?.age || "",
    location: initialData?.location || "",
    description: initialData?.description || "",
    imageUrl: initialData?.imageUrl || "",
    contactNumber: initialData?.contactNumber || "",
    contactName: initialData?.contactName || "",
    urgency: initialData?.urgency || ("Medium" as UrgencyLevel),
    traits: initialData?.traits || "",
  });

  const generateBio = async () => {
    if (!formData.name || !formData.traits) return;
    setLoadingBio(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const res = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Create a heartwarming, emotional 2-sentence adoption bio for a stray ${formData.type} named ${formData.name}. Traits: ${formData.traits}. Focus on empathy and a new beginning.`
      });
      setFormData(prev => ({ ...prev, description: res.text?.trim() || "" }));
    } catch {
      alert("AI generator failed. Please write manually.");
    } finally { setLoadingBio(false); }
  };

  const inputStyles = `w-full p-4 rounded-3xl border font-bold text-sm transition-all outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 ${
    darkMode 
      ? "bg-stone-900 border-stone-500 text-white placeholder-stone-500" 
      : "bg-white border-stone-400 text-stone-950 placeholder-stone-500"
  }`;
  
  const labelStyles = `text-[10px] font-black uppercase tracking-widest mb-2 block px-1 ${
    darkMode ? "text-stone-300 opacity-90" : "text-stone-700 opacity-100"
  }`;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col sm:items-center sm:justify-center bg-black/80 backdrop-blur-md overflow-hidden animate-in fade-in duration-300 no-print">
      <div className={`flex flex-col w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-xl sm:rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 ${darkMode ? "bg-stone-900 text-stone-100" : "bg-white text-stone-800"}`}>
        
        <div className={`p-6 border-b flex justify-between items-center shrink-0 ${darkMode ? "border-stone-800" : "border-stone-200"}`}>
          <div>
             <h2 className="text-xl sm:text-2xl font-black">{initialData ? "Update street friend" : "List new stray"}</h2>
             <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-amber-500">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse mr-1"></span> StreetPaws Verified
             </div>
          </div>
          <button onClick={onClose} className={`p-3 rounded-full transition-all flex items-center justify-center ${darkMode ? "bg-stone-800 text-white hover:bg-stone-700" : "bg-stone-100 text-stone-900 hover:bg-stone-200"}`}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...normalizePet(initialData || {}), ...formData, postedAt: initialData?.postedAt || new Date() }); }} className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar scrollbar-hide pb-24">
          <div className="space-y-6">
            <section>
              <h3 className="text-[11px] font-black mb-4 flex items-center gap-2 text-blue-600 uppercase tracking-widest"><User size={14}/> Identity</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelStyles}>Pet Name *</label>
                  <input required className={inputStyles} placeholder="Buddy, Fluffy..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className={labelStyles}>Animal Type *</label>
                  <select className={inputStyles} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                    <option>Dog</option>
                    <option>Cat</option>
                    <option>Bird</option>
                    <option>Rat</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelStyles}>Age *</label>
                  <input required className={inputStyles} placeholder="e.g., 2 years, 6 months..." value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-black flex items-center gap-2 text-red-600 uppercase tracking-widest"><ImageIcon size={14}/> Photos</h3>
                <a href="https://www.image2url.com/" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                   <ImageIcon size={10} /> Need a link? Upload here
                </a>
              </div>
              <div className="space-y-3">
                <label className={labelStyles}>Direct Image URL *</label>
                <input required className={inputStyles} type="url" placeholder="Paste a link to a photo..." value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
                {formData.imageUrl && (
                  <div className="relative aspect-video rounded-3xl overflow-hidden shadow-inner border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800">
                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800')} />
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full font-bold">LIVE PREVIEW</div>
                  </div>
                )}
                <p className="text-[9px] opacity-80 font-bold px-2 italic text-stone-500">Use the link above if you only have a photo file.</p>
              </div>
            </section>

            <section className={`p-6 rounded-[2rem] border-2 border-dashed ${darkMode ? "bg-stone-800/30 border-stone-600" : "bg-amber-50/50 border-amber-300"}`}>
               <h3 className="text-[11px] font-black flex items-center gap-2 text-amber-700 uppercase tracking-widest mb-4"><Sparkles size={14}/> AI Personality Engine</h3>
               <div className="space-y-4">
                  <div>
                    <label className={labelStyles}>Key Traits (Personality)</label>
                    <div className="flex gap-2">
                      <input className={`${inputStyles} border-amber-500/50`} placeholder="Energetic, sweet, shy..." value={formData.traits} onChange={e => setFormData({...formData, traits: e.target.value})} />
                      <button type="button" onClick={generateBio} disabled={loadingBio || !formData.traits} className="bg-amber-500 text-stone-900 px-6 rounded-2xl font-black text-xs hover:bg-amber-600 active:scale-95 disabled:opacity-30 border border-amber-600">
                        {loadingBio ? "..." : "AI Story"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={labelStyles}>The Heart of their Story *</label>
                    <textarea required className={`${inputStyles} resize-none border-amber-500/50 h-28`} placeholder="Share how you met and why they deserve a home..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                  </div>
               </div>
            </section>

            <section>
              <h3 className="text-[11px] font-black mb-4 flex items-center gap-2 text-green-700 uppercase tracking-widest"><Phone size={14}/> Contact Details</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyles}>Location Description *</label>
                    <input required className={inputStyles} placeholder="Near City Park, Sector 4..." value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                  </div>
                  <div>
                    <label className={labelStyles}>Reporter Name *</label>
                    <input required className={inputStyles} placeholder="Your name" value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className={labelStyles}>WhatsApp Number *</label>
                  <input required type="tel" className={inputStyles} placeholder="Format: 917905013678" value={formData.contactNumber} onChange={e => setFormData({...formData, contactNumber: e.target.value})} />
                </div>
              </div>
            </section>
          </div>
          
          <div className={`absolute bottom-0 left-0 right-0 p-6 bg-inherit/95 backdrop-blur-md border-t ${darkMode ? "border-stone-800" : "border-stone-200"}`}>
            <button type="submit" className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-4 rounded-3xl font-black text-lg shadow-xl shadow-amber-500/20 active:scale-95 transition-all">
               {initialData ? "Save changes" : "Launch listing"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Poster Modal ---

const PosterModal: React.FC<{ pet: Pet; onClose: () => void; darkMode: boolean }> = ({ pet, onClose, darkMode }) => {
  const [downloading, setDownloading] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!posterRef.current || downloading) return;
    setDownloading(true);
    try {
      const original = posterRef.current;
      const clone = original.cloneNode(true) as HTMLDivElement;
      
      clone.style.width = "800px";
      clone.style.height = "auto";
      clone.style.position = "absolute";
      clone.style.top = "-9999px";
      clone.style.left = "-9999px";
      clone.style.boxShadow = "none";
      clone.style.transform = "none";
      clone.style.borderWidth = "20px";

      document.body.appendChild(clone);

      await new Promise(r => setTimeout(r, 300));

      // @ts-ignore
      const canvas = await html2canvas(clone, {
        useCORS: true,
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
        width: 800,
        height: clone.scrollHeight,
      });
      
      document.body.removeChild(clone);

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `ADOPT_ME_${pet.name.toUpperCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
      alert("Capture failed.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col sm:items-center sm:justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 overflow-hidden">
      
      <div className={`flex flex-col w-full h-full sm:h-auto sm:max-h-[95vh] sm:max-w-xl overflow-hidden animate-in zoom-in-95 duration-500 ${darkMode ? "bg-stone-900 text-stone-100" : "bg-white text-stone-900"} sm:rounded-[2.5rem] shadow-2xl`}>
        
        <div className={`p-4 sm:p-5 border-b flex justify-between items-center sticky top-0 z-20 no-print ${darkMode ? "bg-stone-900 border-stone-800" : "bg-white border-stone-100"}`}>
            <h3 className="font-black text-lg">Poster View</h3>
            <div className="flex items-center gap-2">
                <button onClick={handleDownload} disabled={downloading} className="bg-amber-500 text-stone-900 px-4 py-2 rounded-xl flex items-center gap-2 font-black text-xs active:scale-95 transition-all disabled:opacity-50">
                   <Download size={16}/> {downloading ? "Wait..." : "Save"}
                </button>
                <button onClick={onClose} className={`p-2 rounded-full flex items-center justify-center ${darkMode ? "bg-stone-800 text-white" : "bg-stone-100 text-stone-900"}`}>
                  <X size={20} />
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar bg-stone-200 p-4 sm:p-8 flex flex-col items-center">
          
          <div 
            ref={posterRef}
            id="printable-poster" 
            className="bg-white border-[12px] sm:border-[16px] border-red-600 flex flex-col items-center text-center w-full max-w-[450px] shadow-2xl relative"
            style={{ height: 'auto', minHeight: '636px' }}
          >
              {/* Header */}
              <div className="bg-red-600 text-white w-full py-8 sm:py-12 px-4 flex flex-col items-center">
                <h1 className="text-4xl sm:text-6xl font-black uppercase italic leading-none">ADOPT ME!</h1>
                <p className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.3em] mt-3 opacity-90">EVERY LIFE DESERVES A HOME</p>
              </div>

              {/* Main Image Container */}
              <div className="w-full px-6 sm:px-8 mt-8 sm:mt-12 relative">
                  <div className="aspect-[4/5] bg-white rounded-[2rem] sm:rounded-[3rem] border-2 sm:border-4 border-black shadow-2xl overflow-hidden w-full relative">
                    <img src={pet.imageUrl} className="w-full h-full object-cover" alt={pet.name} crossOrigin="anonymous" />
                  </div>
                  
                  {/* Floating Badge */}
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-amber-500 text-stone-900 px-8 sm:px-12 py-4 sm:py-6 rounded-full font-black text-xs sm:text-xl shadow-2xl border-2 sm:border-4 border-white whitespace-nowrap z-10">
                    HI, I'M {pet.name.toUpperCase()}!
                  </div>
              </div>

              {/* Name and Detail */}
              <div className="mt-12 sm:mt-20 px-8 sm:px-10 pb-12 w-full flex flex-col items-center">
                 <h2 className="text-4xl sm:text-6xl font-black text-stone-900 mb-2 uppercase">{pet.name}</h2>
                 <p className="text-[10px] sm:text-sm font-bold uppercase tracking-[0.2em] text-stone-400">
                   {pet.type} • SPIED AT {pet.location.toUpperCase()}
                 </p>
                 
                 {/* Decorative Separator */}
                 <div className="h-1 sm:h-2 w-16 sm:w-20 bg-pink-300 rounded-full mt-8 opacity-60"></div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Pet Card Component ---

const PetCard: React.FC<{
  pet: Pet;
  isFavorite: boolean;
  darkMode: boolean;
  viewMode: ViewMode;
  onToggleFavorite: () => void;
  onGeneratePoster: () => void;
  onAddComment: (id: string, text: string) => void;
  onCheer: (id: string) => void;
  onStatusChange: (id: string, status: PetStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
  addToast: (message: string, type?: "success" | "error" | "info") => void;
}> = ({ pet, isFavorite, darkMode, viewMode, onToggleFavorite, onGeneratePoster, onAddComment, onCheer, onStatusChange, onEdit, onDelete, addToast }) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const waMsg = encodeURIComponent(`🚨 Interest in ${pet.name} (${pet.type})\n\nHi ${pet.contactName}, I saw your listing on StreetPaws from ${pet.location}.\n\nAbout them: ${pet.description}\n\nI'd like to help!`);

  const priorityColors = pet.urgency === "Critical" ? "bg-red-500 text-white" : pet.urgency === "High" ? "bg-orange-500 text-white" : pet.urgency === "Medium" ? "bg-amber-400 text-stone-900" : "bg-green-500 text-white";

  const handleShare = async () => {
    const title = `Adopt ${pet.name} - StreetPaws`;
    const text = `Meet ${pet.name}, a lovely ${pet.type} looking for a home!\n\n"${pet.description}"\n\nContact: ${pet.contactName} (${pet.contactNumber})`;
    const url = window.location.origin + window.location.pathname;
    
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }

    try {
      const shareContent = `${title}\n\n${text}\n\nPhoto: ${pet.imageUrl}\n\nLink: ${url}`;
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareContent);
        addToast("Details copied!", "success");
      }
    } catch (fallbackErr) {
      addToast("Failed to share details.", "error");
    }
  };

  return (
    <div className={`group relative rounded-[2.5rem] overflow-hidden border-2 transition-all duration-500 flex flex-col ${darkMode ? "bg-stone-800 border-stone-800 hover:border-amber-500/50 shadow-amber-500/5" : "bg-white border-white hover:border-amber-500/50 hover:shadow-2xl shadow-stone-200/50"}`}>
      
      <div className="relative aspect-[4/5] sm:aspect-[4/3] w-full overflow-hidden">
        <img
          src={pet.imageUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800'}
          alt={pet.name}
          className={`w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 ${pet.status !== 'Available' ? 'grayscale opacity-60' : ''}`}
        />
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg ${priorityColors}`}>
            {pet.urgency}
          </span>
          {pet.status !== 'Available' && <span className="bg-stone-900 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full shadow-lg">{pet.status}</span>}
        </div>
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
          <button onClick={onToggleFavorite} className="p-3 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md rounded-full shadow-xl hover:scale-125 transition-all">
            <Heart size={20} className={isFavorite ? "fill-red-500 text-red-500" : "text-stone-400"} />
          </button>
        </div>
        
        <button 
          onClick={(e) => { e.stopPropagation(); handleShare(); }} 
          className="absolute bottom-4 right-4 p-3 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md rounded-full shadow-xl hover:scale-110 transition-all z-20 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto shadow-amber-500/20"
        >
          <Share2 size={18} className="text-amber-500" />
        </button>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-1">
           <h3 className="text-2xl font-black truncate pr-4">{pet.name}</h3>
           <div className="flex gap-1 shrink-0">
             <button onClick={onEdit} className="p-2.5 rounded-full hover:bg-amber-500/10 text-stone-400 hover:text-amber-600 transition-colors"><Pencil size={18} /></button>
             <button onClick={onDelete} className="p-2.5 rounded-full hover:bg-red-500/10 text-stone-400 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
           </div>
        </div>
        <p className="text-[11px] font-black uppercase tracking-widest opacity-40 mb-3">{pet.type} • {pet.age || 'Soul'}</p>

        <div className="flex items-center gap-2 mb-4 text-sm opacity-70">
          <MapPin size={16} className="text-amber-500" />
          <span className="truncate font-semibold">{pet.location}</span>
        </div>

        <p className="text-sm leading-relaxed opacity-80 mb-6 line-clamp-3 italic">"{pet.description}"</p>

        <div className="mt-auto space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-xs">
                {pet.contactName.charAt(0)}
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Reporter</p>
                <p className="text-xs font-bold truncate">{pet.contactName}</p>
             </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <a href={`https://wa.me/${pet.contactNumber}?text=${waMsg}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center gap-1 bg-[#25D366] text-white py-2 rounded-2xl font-black text-[10px] shadow-lg hover:scale-105 active:scale-95 transition-all">
              <MessageCircle size={14} /> WhatsApp
            </a>
            <button onClick={onGeneratePoster} className={`flex flex-col items-center justify-center gap-1 py-2 rounded-2xl font-black text-[10px] shadow-lg hover:scale-105 active:scale-95 transition-all ${darkMode ? "bg-stone-100 text-stone-900" : "bg-stone-900 text-white"}`}>
              <Printer size={14} /> Poster
            </button>
            <button onClick={handleShare} className="flex flex-col items-center justify-center gap-1 bg-amber-500 text-stone-900 py-2 rounded-2xl font-black text-[10px] shadow-lg hover:scale-105 active:scale-95 transition-all">
              <Share2 size={14} /> Share
            </button>
          </div>

          <div className="pt-4 border-t border-stone-100 dark:border-stone-700 flex justify-between items-center">
             <div className="flex gap-4">
                <button onClick={() => onCheer(pet.id)} className="flex items-center gap-1.5 text-xs font-bold hover:text-amber-500 transition-colors">
                  <Sparkles size={14} className={pet.cheers > 0 ? "text-amber-500" : "text-stone-400"} /> {pet.cheers}
                </button>
                <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 text-xs font-bold text-stone-500">
                  <MessageCircle size={14} /> {pet.comments.length}
                </button>
             </div>
             <select className="bg-transparent border-none text-[10px] font-black uppercase tracking-tighter text-amber-600 outline-none cursor-pointer" value={pet.status} onChange={(e) => onStatusChange(pet.id, e.target.value as PetStatus)}>
                <option value="Available">Available</option>
                <option value="Adopted">Adopted</option>
                <option value="Fostered">Fostered</option>
             </select>
          </div>

          {showComments && (
            <div className="animate-in slide-in-from-top-2 duration-300 pt-2">
               <div className="space-y-2 mb-3 max-h-32 overflow-y-auto pr-2 no-scrollbar">
                  {pet.comments.map(c => <div key={c.id} className={`p-3 rounded-2xl text-[11px] font-medium leading-relaxed ${darkMode ? "bg-stone-700/50 text-stone-200" : "bg-stone-50 text-stone-700"}`}>{c.text}</div>)}
               </div>
               <div className="flex gap-2">
                 <input value={newComment} onChange={e => setNewComment(e.target.value)} onKeyPress={e => e.key === 'Enter' && (onAddComment(pet.id, newComment), setNewComment(""))} placeholder="Write a note..." className={`flex-1 px-4 py-2.5 rounded-2xl text-[11px] outline-none border focus:border-amber-500 ${darkMode ? "bg-stone-900 border-stone-700 text-white" : "bg-white"}`} />
                 <button onClick={() => { if(newComment.trim()){ onAddComment(pet.id, newComment); setNewComment(""); } }} className="p-2.5 bg-amber-500 text-stone-900 rounded-xl active:scale-90 transition-transform"><Send size={14}/></button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Recommendation Modal ---

function RecommendationModal({ isOpen, onClose, pets, onRecommend, darkMode }: { isOpen: boolean, onClose: () => void, pets: Pet[], onRecommend: (ids: string[]) => void, darkMode: boolean }) {
    const [answers, setAnswers] = useState({ type: 'Any' });
    if (!isOpen) return null;
    const handleFinish = () => {
        const matches = pets.filter(p => answers.type === 'Any' || p.type === answers.type);
        onRecommend(matches.map(p => p.id));
    };
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md no-print">
            <div className={`p-8 rounded-[3rem] shadow-2xl w-full max-w-md border-4 border-white dark:border-stone-800 ${darkMode ? "bg-stone-900 text-white" : "bg-white text-stone-800"}`}>
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black flex items-center gap-2">Match Finder</h2>
                    <button onClick={onClose} className="text-stone-400 hover:text-stone-900"><X size={24} /></button>
                </div>
                <div className="space-y-8">
                    <h3 className="text-lg font-bold">What soul are you looking for?</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {['Dog', 'Cat', 'Bird', 'Any'].map(t => <button key={t} onClick={() => setAnswers({type: t as any})} className={`p-6 rounded-[2.5rem] border-2 font-black transition-all ${answers.type === t ? 'bg-amber-500 border-amber-500 text-stone-900 shadow-xl shadow-amber-500/20' : 'border-stone-100 dark:border-stone-800 text-stone-400'}`}>{t}</button>)}
                    </div>
                    <button onClick={handleFinish} className="w-full bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-900 py-5 rounded-[2.5rem] font-black shadow-2xl active:scale-95 transition-all">Show Results</button>
                </div>
            </div>
        </div>
    );
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error('Root element not found');
createRoot(rootElement).render(<App />);