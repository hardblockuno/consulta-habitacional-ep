from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("habitacional", "0002_alerta_impacta_estado"),
    ]

    operations = [
        migrations.AddField(
            model_name="caracterizacionsocial",
            name="grupo_familiar",
            field=models.CharField(blank=True, max_length=120),
        ),
    ]
