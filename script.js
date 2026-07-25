// Ganti dengan URL Project Anda dari Supabase
const SUPABASE_URL = 'MASUKKAN_PROJECT_URL_ANDA_DISINI'; 
// Ganti dengan Publishable Key dari Supabase (yang diawali sb_publishable...)
const SUPABASE_ANON_KEY = 'MASUKKAN_PUBLISHABLE_KEY_ANDA_DISINI'; 

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();

    document.getElementById('btnAdd').addEventListener('click', async () => {
        const name = document.getElementById('productName').value;
        const category = document.getElementById('productCategory').value;
        const price = document.getElementById('productPrice').value;
        const imageFile = document.getElementById('productImage').files[0];

        if (!name || !price) {
            alert('Nama dan Harga produk wajib diisi!');
            return;
        }

        let imageUrl = '';
        const btn = document.getElementById('btnAdd');
        btn.innerText = 'Menyimpan...';
        btn.disabled = true;

        try {
            // 1. Upload Foto ke Supabase Storage jika ada file
            if (imageFile) {
                const fileName = `${Date.now()}_${imageFile.name}`;
                const { error: uploadError } = await _supabase.storage
                    .from('product-images')
                    .upload(fileName, imageFile);

                if (uploadError) {
                    alert('Gagal upload gambar: ' + uploadError.message);
                    btn.innerText = '+ Tambah Produk';
                    btn.disabled = false;
                    return;
                }

                const { data: publicURLData } = _supabase.storage
                    .from('product-images')
                    .getPublicUrl(fileName);

                imageUrl = publicURLData.publicUrl;
            }

            // 2. Simpan Data ke Tabel 'products'
            const { error: insertError } = await _supabase
                .from('products')
                .insert([{ name, category, price: parseFloat(price), image_url: imageUrl }]);

            if (insertError) {
                alert('Gagal menyimpan ke database: ' + insertError.message);
            } else {
                // Reset form setelah berhasil
                document.getElementById('productName').value = '';
                document.getElementById('productCategory').value = '';
                document.getElementById('productPrice').value = '';
                document.getElementById('productImage').value = '';
                
                // Refresh tabel
                fetchProducts();
            }
        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan sistem.');
        } finally {
            btn.innerText = '+ Tambah Produk';
            btn.disabled = false;
        }
    });
});

// Fungsi Menampilkan Data ke Tabel
async function fetchProducts() {
    const tableBody = document.getElementById('productTableBody');
    tableBody.innerHTML = `<tr><td colspan="5" class="empty-text">Memuat data...</td></tr>`;

    const { data, error } = await _supabase
        .from('products')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        tableBody.innerHTML = `<tr><td colspan="5" class="empty-text">Gagal memuat data dari database.</td></tr>`;
        return;
    }

    if (!data || data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="empty-text">Belum ada produk.</td></tr>`;
        return;
    }

    tableBody.innerHTML = '';
    data.forEach(product => {
        const imgTag = product.image_url 
            ? `<img src="${product.image_url}" class="thumb-img">` 
            : `<span style="font-size:11px; color:#aaa;">No Image</span>`;

        tableBody.innerHTML += `
            <tr>
                <td>${imgTag}</td>
                <td><b>${product.name}</b></td>
                <td>${product.category || '-'}</td>
                <td>Rp ${Number(product.price).toLocaleString('id-ID')}</td>
                <td><button class="btn-hapus" onclick="deleteProduct(${product.id})">Hapus</button></td>
            </tr>
        `;
    });
}

// Fungsi Hapus Produk
async function deleteProduct(id) {
    if (confirm('Yakin ingin menghapus produk ini?')) {
        const { error } = await _supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            alert('Gagal menghapus produk: ' + error.message);
        } else {
            fetchProducts();
        }
    }
}
