using System;
using Messaging.Models;
using Microsoft.Extensions.Options;
using Azure.Communication.Chat;
using Azure.Communication.Identity;

namespace Messaging.Services
{
    public class CommunicationService
    {
        private readonly CommunicationIdentityClient _identityClient;

        public CommunicationService(AzureCommunicationSettings config)
        {
            _identityClient = new CommunicationIdentityClient(config.ConnectionString);
        }

        public async Task<(string userId, string userToken)> GetUserTokenAsync()
        {
            try
            {
                var user = await _identityClient.CreateUserAsync();
                var userId = user.Value;

                var tokenResponse = await _identityClient.GetTokenAsync(userId, new[] { CommunicationTokenScope.Chat });
                var userToken = tokenResponse.Value.Token;
                Azure.Communication.CommunicationUserIdentifier a = new Azure.Communication.CommunicationUserIdentifier(userId.Id);
                return (userId.Id, userToken);
            }
            catch (Exception ex)
            {
                // Handle exception as needed
                throw new ApplicationException($"Error generating user token: {ex.Message}", ex);
            }
        }
    }

}

