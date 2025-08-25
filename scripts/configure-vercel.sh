#!/bin/bash

echo "🚀 Configuration des variables d'environnement Vercel..."

# Variables Supabase
SUPABASE_URL="https://ypygrfrwpddqjbahgayc.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlweWdyZnJ3cGRkcWpiYWhnYXljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNzc0OTksImV4cCI6MjA3MTY1MzQ5OX0.uez2gvTIVasuatFvfhRyuxFcIrVTFabDOEA2psAye2w"

echo "📝 Commandes à exécuter sur Vercel Dashboard:"
echo ""
echo "1. Allez sur https://vercel.com/dashboard"
echo "2. Sélectionnez votre projet 'aistrat360'"
echo "3. Allez dans Settings > Environment Variables"
echo "4. Ajoutez ces variables:"
echo ""
echo "NEXT_PUBLIC_SUPABASE_URL = $SUPABASE_URL"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY = $SUPABASE_ANON_KEY"
echo ""
echo "5. Redéployez le projet"
echo ""

# Si vous avez Vercel CLI installé, décommentez les lignes suivantes:
# echo "🔧 Configuration automatique via Vercel CLI..."
# vercel env add NEXT_PUBLIC_SUPABASE_URL production
# vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# echo "✅ Variables ajoutées, redéploiement..."
# vercel --prod

echo "✅ Instructions affichées. Configurez manuellement sur Vercel Dashboard."