#!/bin/bash
# Script de instalación del Panel Administrador GradMemories
# Usar: bash setup_admin.sh

echo "================================================"
echo "  🔐 Setup Panel Administrador GradMemories  "
echo "================================================"
echo ""

# Verificar archivos
echo "✓ Verificando archivos..."
files=(
    "admin.html"
    "js/admin.js"
    "ADMIN_PANEL.md"
    "GUIA_ADMIN.html"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ FALTA: $file"
    fi
done

echo ""
echo "================================================"
echo "  ⚙️  Pasos para comenzar"
echo "================================================"
echo ""
echo "1. ACCEDER AL PANEL:"
echo "   - Abre admin.html en tu navegador"
echo "   - O usa esta URL: file:///ruta/a/admin.html"
echo ""
echo "2. INICIAR SESIÓN:"
echo "   - Contraseña: admin123"
echo ""
echo "3. GESTIONAR EVENTOS Y MEDIOS:"
echo "   - Dashboard: Ver estadísticas"
echo "   - Subir Media: Cargar fotos/videos"
echo "   - Gestionar Medios: Ver y eliminar"
echo "   - Gestionar Eventos: Crear/eliminar eventos"
echo ""
echo "4. CAMBIAR CONTRASEÑA (opcional):"
echo "   - Edita js/admin.js"
echo "   - Busca: const ADMIN_PASSWORD = 'admin123';"
echo "   - Cambia a tu nueva contraseña"
echo ""
echo "================================================"
echo "  📖 Documentación"
echo "================================================"
echo ""
echo "- ADMIN_PANEL.md: Guía técnica completa"
echo "- GUIA_ADMIN.html: Guía visual interactiva"
echo "- ADMIN_IMPLEMENTADO.md: Resumen de características"
echo ""
echo "================================================"
echo "  ✅ Setup completado"
echo "================================================"
