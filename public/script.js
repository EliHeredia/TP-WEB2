let currentPage = 1; 
const itemsPerPage = 20;
let totalPages = 1;
let allObjectIDs = [];

document.getElementById('search').addEventListener('click', async () => {
    const keyword = document.getElementById('keyword').value;
    const department = document.getElementById('department').value; // Valor del departamento
    const location = document.getElementById('location').value;     // Valor de la localización

    let apiUrl = 'https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true';

    // Agregar departamento si fue seleccionado
    if (department) {
        apiUrl += `&departmentId=${department}`;
    }

    // Agregar palabra clave si fue proporcionada
    if (keyword) {
        apiUrl += `&q=${keyword}`;
    }

    // Agregar localización si fue seleccionada
    if (location) {
        apiUrl += `&geoLocation=${location}`;
    }

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data.objectIDs && data.objectIDs.length > 0) {
            allObjectIDs = data.objectIDs;
            totalPages = Math.ceil(allObjectIDs.length / itemsPerPage); // Calcular el total de páginas
            currentPage = 1; // Reiniciar a la primera página
            displayResultsPaginated(currentPage);
            displayPaginationControls();
        } else {
            document.getElementById('resultados').innerHTML = '<p>No se encontraron resultados.</p>';
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('resultados').innerHTML = '<p>Error recuperando los datos.</p>';
    }
});

async function displayResultsPaginated(page) {
    const resultsContainer = document.getElementById('resultados');
    resultsContainer.innerHTML = ''; // Limpiar resultados previos
    
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const objectIDsToShow = allObjectIDs.slice(startIndex, endIndex); // Obtener IDs de la página actual

    for (const id of objectIDsToShow) {
        try {
            const response = await fetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`);
            const data = await response.json();

            if (data.primaryImageSmall) {
                const artItem = document.createElement('div');
                artItem.classList.add('art-item');
                
                // Llamar a la función de traducción
                const translatedData = await translateData(data.title, data.culture, data.dynasty);

                artItem.innerHTML = `
                    <img src="${data.primaryImageSmall}" alt="${data.title}" width="200" height="200" title="Fecha de creación: ${data.objectDate || 'Desconocida'}">
                    <p><strong>${translatedData.title || 'Sin título'}</strong></p>
                    <p>Cultura: ${translatedData.culture || 'Desconocido'}</p>
                    <p>Dinastía: ${translatedData.dynasty || 'Desconocido'}</p>
                `;

                // Verificar si hay imágenes adicionales
                if (data.additionalImages && data.additionalImages.length > 0) {
                    const additionalImagesButton = document.createElement('button');
                    additionalImagesButton.textContent = 'Ver imágenes adicionales';
                    additionalImagesButton.addEventListener('click', () => {
                        openAdditionalImagesPage(data.additionalImages);
                    });
                    artItem.appendChild(additionalImagesButton);
                }

                resultsContainer.appendChild(artItem);
            }
        } catch (error) {
            console.error('Error fetching object data:', error);
        }
    }
}

async function translateData(title, culture, dynasty) {
    try {
        const response = await fetch('/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title, culture, dynasty }),
        });

        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }

        return await response.json();
    } catch (error) {
        console.error('Error al traducir:', error);
        return {
            title: title, // Devuelve el original si falla
            culture: culture,
            dynasty: dynasty
        };
    }
}

function openAdditionalImagesPage(images) {
    // Crear una nueva ventana o pestaña para mostrar las imágenes adicionales
    const newWindow = window.open('', '_blank');
    newWindow.document.write('<html><head><title>Imágenes adicionales</title></head><body>');
    newWindow.document.write('<h1>Imágenes adicionales</h1>');

    // Iterar a través de las imágenes adicionales y mostrarlas
    images.forEach((imageUrl) => {
        newWindow.document.write(`<img src="${imageUrl}" style="max-width: 100%; margin-bottom: 10px;"><br>`);
    });

    newWindow.document.write('</body></html>');
    newWindow.document.close();
}

function displayPaginationControls() {
    const paginationContainer = document.getElementById('pagination-controls');
    paginationContainer.innerHTML = ''; // Limpiar controles de paginación previos

    const prevButton = document.createElement('button');
    prevButton.textContent = 'Anterior';
    prevButton.disabled = currentPage === 1; // Deshabilitar si es la primera página
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayResultsPaginated(currentPage);
            displayPaginationControls();
        }
    });

    const nextButton = document.createElement('button');
    nextButton.textContent = 'Siguiente';
    nextButton.disabled = currentPage === totalPages; // Deshabilitar si es la última página
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayResultsPaginated(currentPage);
            displayPaginationControls();
        }
    });

    // Mostrar el número de la página actual
    const pageInfo = document.createElement('span');
    pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;

    paginationContainer.appendChild(prevButton);
    paginationContainer.appendChild(pageInfo);
    paginationContainer.appendChild(nextButton);
}
