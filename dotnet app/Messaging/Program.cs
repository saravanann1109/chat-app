using Azure.Storage.Blobs;
using Messaging.Models;
using Messaging.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen((c) =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo() { Title = "MessagingSwagger", Version = "v1" });
    c.DescribeAllParametersInCamelCase();
});

builder.Services.Configure<AzureCommunicationSettings>(builder.Configuration.GetSection("AzureCommunicationSettings"));
builder.Services.AddSingleton(sp =>
                sp.GetRequiredService<IOptions<AzureCommunicationSettings>>().Value);
builder.Services.AddCors(options => options.AddPolicy("MessagingPolicy",
   policy => {
       policy.WithOrigins("http://localhost:4200")
          .AllowAnyMethod()
          .AllowAnyHeader();
   }));

var app = builder.Build();

// Configure the HTTP request pipeline.
//if (app.Environment.IsDevelopment())
//{
    app.UseSwagger();
    app.UseSwaggerUI();
//}

app.UseCors("MessagingPolicy");
app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
