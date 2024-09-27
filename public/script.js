let pagActual = 1; 
const itemsPorPag = 20;
let totalPag = 1;
let allObjectIDs = [];

document.getElementById('search').addEventListener('click', async () => {
    const keyword = document.getElementById('keyword').value;
    const department = document.getElementById('department').value; 
    const location = document.getElementById('location').value;     

    let apiUrl = 'https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true';

    
    if (department) {
        apiUrl += `&departmentId=${department}`;
    }

  
    if (keyword) {
        apiUrl += `&q=${keyword}`;
    }

   
    if (location) {
        apiUrl += `&geoLocation=${location}`;
    }

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data.objectIDs && data.objectIDs.length > 0) {
            allObjectIDs = data.objectIDs;
            totalPag = Math.ceil(allObjectIDs.length / itemsPorPag); 
            pagActual = 1;
            displayResultsPaginated(pagActual);
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
    resultsContainer.innerHTML = ''; 

    const startIndex = (page - 1) * itemsPorPag;
    const endIndex = startIndex + itemsPorPag;
    const objectIDsToShow = allObjectIDs.slice(startIndex, endIndex); 

    for (const id of objectIDsToShow) {
        try {
            const response = await fetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`);
            const data = await response.json();

            if (data.primaryImageSmall) {
                const artItem = document.createElement('div');
                artItem.classList.add('art-item');
                
                
                const translatedData = await translateData(data.title, data.culture, data.dynasty);

                artItem.innerHTML = `
                    <img src="${data.primaryImageSmall}" alt="${data.title}" width="200" height="200" title="Fecha de creación: ${data.objectDate || 'Desconocida'}">
                    <p><strong>${translatedData.title || 'Sin título'}</strong></p>
                    <p>Cultura: ${translatedData.culture || 'Desconocido'}</p>
                    <p>Dinastía: ${translatedData.dynasty || 'Desconocido'}</p>
                `;
                
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
            title: title, 
            culture: culture,
            dynasty: dynasty
        };
    }
}

function openAdditionalImagesPage(images) {
    
    const newWindow = window.open('', '_blank');
    newWindow.document.write('<html><head><title>Imágenes adicionales</title></head><body>');
    newWindow.document.write('<h1>Imágenes adicionales</h1>');

    
    images.forEach((imageUrl) => {
        newWindow.document.write(`<img src="${imageUrl}" style="max-width: 100%; margin-bottom: 10px;"><br>`);
    });

    newWindow.document.write('</body></html>');
    newWindow.document.close();
}

function displayPaginationControls() {
    const paginationContainer = document.getElementById('paginacion');
    paginationContainer.innerHTML = ''; 

    const prevButton = document.createElement('button');
    prevButton.textContent = 'Anterior';
    prevButton.disabled = pagActual === 1; 
    prevButton.addEventListener('click', () => {
        if (pagActual > 1) {
            pagActual--;
            displayResultsPaginated(pagActual);
            displayPaginationControls();
        }
    });

    const nextButton = document.createElement('button');
    nextButton.textContent = 'Siguiente';
    nextButton.disabled = pagActual === totalPag; 
    nextButton.addEventListener('click', () => {
        if (pagActual< totalPag) {
            pagActual++;
            displayResultsPaginated(pagActual);
            displayPaginationControls();
        }
    });

    
    const pageInfo = document.createElement('span');
    pageInfo.textContent = `Página ${pagActual} de ${totalPag}`;

    paginationContainer.appendChild(prevButton);
    paginationContainer.appendChild(pageInfo);
    paginationContainer.appendChild(nextButton);
}
