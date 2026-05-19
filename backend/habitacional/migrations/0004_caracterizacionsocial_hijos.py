from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("habitacional", "0003_caracterizacionsocial_grupo_familiar"),
    ]

    operations = [
        migrations.AddField(
            model_name="caracterizacionsocial",
            name="hijos",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
