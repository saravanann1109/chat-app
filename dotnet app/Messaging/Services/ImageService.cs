using System;
using Azure.Storage.Blobs;

namespace Messaging.Services
{
    // IImageRepository.cs
    public interface IImageService
    {
        Task<string> UploadImageAsync(IFormFile image);

        Task<Azure.Storage.Blobs.Models.BlobDownloadInfo> GetImage(string uid);
    }

    // ImageRepository.cs
    public class ImageService : IImageService
    {
        private readonly BlobServiceClient _blobServiceClient;
        private readonly string _containerName = "your-container-name"; // Replace with your Azure Storage container name

        public ImageService(BlobServiceClient blobServiceClient)
        {
            _blobServiceClient = blobServiceClient;
            _containerName = "chat-files";
        }

        public async Task<string> UploadImageAsync(IFormFile image)
        {
            var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
            await containerClient.CreateIfNotExistsAsync();

            var guid = Guid.NewGuid();
            var blobClient = containerClient.GetBlobClient(guid.ToString());
            await blobClient.UploadAsync(image.OpenReadStream(), true);

            return blobClient.Uri.ToString();
        }

        public async Task<Azure.Storage.Blobs.Models.BlobDownloadInfo> GetImage(string uid)
        {
            var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
            string url = uid.Split("/").Last();
            var blobClient = containerClient.GetBlobClient(url);
            var blobDownloadInfo = await blobClient.DownloadAsync();
            var contentType = blobDownloadInfo.Value.Details.ContentType;
            return blobDownloadInfo.Value;
        }
    }
}

